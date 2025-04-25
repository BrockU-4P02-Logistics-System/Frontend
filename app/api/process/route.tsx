import { NextRequest, NextResponse } from 'next/server';
import amqp from 'amqplib';

interface MarkerLocation {
    address: string;
    latitude: number;
    longitude: number;
    note?: string;
    arrivalTime?: string;
    departureTime?: string;
    driverId?: number;
    order?: number;
}

interface RouteConfiguration {
    maxSpeed: number;
    weight: number;
    length: number;
    height: number;
    avoidHighways: boolean;
    avoidTolls: boolean;
    avoidUnpaved: boolean;
    avoidFerries: boolean;
    avoidTunnels: boolean;
    avoidUTurns: boolean;
    returnToStart: boolean;
}

interface RequestBody {
    features: MarkerLocation[];
    config: RouteConfiguration;
    numberDrivers: number;
    returnToStart: boolean;
    options?: boolean[];
}

interface GeoJsonGeometry {
    type: string;
    coordinates: number[];
}

interface GeoJsonProperties {
    address?: string;
    order?: number;
    driverId?: number;
    note?: string;
    arrivalTime?: string;
    departureTime?: string;
}

interface GeoJsonFeature {
    type: string;
    geometry: GeoJsonGeometry;
    properties: GeoJsonProperties;
}

interface DriverRoute {
    driverId: number;
    stops: MarkerLocation[];
}

interface MessagePayload {
    features: GeoJsonFeature[];
    numberDrivers: number;
    returnToStart: boolean;
    options: boolean[];
}

interface ResponseFeature {
    geometry: {
        coordinates: number[];
    };
    properties: {
        address?: string;
        order?: number;
        driverId?: number;
    };
}

type RabbitMQResponse = {
    route: ResponseFeature[][];
} | ResponseFeature[][] | ResponseFeature[];

const RABBITMQ_URL = 'amqp://jordan:4p02@40.233.88.212';
const QUEUE_NAME = 'logistic-request';
const TIMEOUT_MS = 270000; // 4.5 minutes (leaving buffer for the 5-minute limit)

export async function POST(req: NextRequest) {
    console.log("Received request");
    let connection: amqp.Connection | null = null;
    let channel: amqp.Channel | null = null;
    
    try {
        const body: RequestBody = await req.json();

        // Validate input
        if (!Array.isArray(body.features)) {
            return NextResponse.json(
                { error: 'Invalid request body: features array is required' },
                { status: 400 }
            );
        }

        console.log("Converting features");

        // Convert markers to GeoJSON features
        const features: GeoJsonFeature[] = body.features.map((marker, index) => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [marker.longitude, marker.latitude]
            },
            properties: {
                address: marker.address,
                order: index + 1,
                note: marker.note,
                arrivalTime: marker.arrivalTime,
                departureTime: marker.departureTime
            }
        }));

        // Connect to RabbitMQ
        console.log("Connecting to RabbitMQ");
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        console.log("Connected to RabbitMQ");

        // Ensure queue exists
        await channel.assertQueue(QUEUE_NAME, {
            durable: true
        });

        // Generate correlation ID
        const correlationId = Math.random().toString() + Date.now().toString();

        // Create response queue and clear out any stale messages
        const { queue: replyTo } = await channel.assertQueue('', { exclusive: true });
        await channel.purgeQueue(replyTo);

        // Ensure there's at least 1 driver
        const numberDrivers = body.numberDrivers || 1;
        
        // Extract route options into an array for the Java backend
        const options = body.options || [
            body.config?.avoidHighways || false,
            body.config?.avoidTolls || false,
            body.config?.avoidUnpaved || false,
            body.config?.avoidFerries || false,
            body.config?.avoidTunnels || false,
            body.config?.avoidUTurns || false
        ];

        // Include the parameters in the message
        const message: MessagePayload = {
            features,
            numberDrivers,
            returnToStart: body.returnToStart || false,
            options
        };
        
        console.log("Sending message to queue with options:", options);
        
        if (message.features.length > 0) {
            console.log("First feature:", message.features[0].properties);
            
            for (const feature of message.features) {
                console.log("Address:", feature.properties.address);
                console.log("Order:", feature.properties.order);
            }
        }
        
        // Send message to queue
        channel.sendToQueue(
            QUEUE_NAME,
            Buffer.from(JSON.stringify(message)),
            {
                correlationId,
                replyTo,
                contentType: 'application/json'
            }
        );

        // Setup cleanup function
        const cleanup = async () => {
            try {
                if (channel) await channel.close();
                if (connection) await connection.close();
                console.log("RabbitMQ resources cleaned up");
            } catch (err) {
                console.error("Error during cleanup:", err);
            }
        };

        // Wait for response with timeout
        const response: RabbitMQResponse = await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Processing timeout after ' + (TIMEOUT_MS / 1000) + ' seconds'));
            }, TIMEOUT_MS);

            channel!.consume(replyTo, (msg) => {
                if (!msg) return;

                if (msg.properties.correlationId !== correlationId) {
                    // For messages that don't belong to this request,
                    // simply acknowledge them to clear them out.
                    channel!.ack(msg);
                    return;
                }

                try {
                    const content = JSON.parse(msg.content.toString());
                    console.log("Received response from backend:", content);
                    if (content?.error) {
                        throw new Error(`Backend error: ${content.error}`);
                    }
                    channel!.ack(msg);
                    clearTimeout(timeoutId);
                    resolve(content);
                } catch (err) {
                    console.error("Error parsing backend response:", err);
                    // Acknowledge even on error so the message isn't requeued.
                    channel!.ack(msg);
                    clearTimeout(timeoutId);
                    reject(err);
                }
            });
        });

        // Make sure to clean up RabbitMQ resources
        await cleanup();

        // Create lookup map for original addresses
        const addressMap = new Map<string, MarkerLocation>();
        body.features.forEach(marker => {
            const key = `${marker.longitude},${marker.latitude}`;
            addressMap.set(key, marker);
        });

        // Process the response
        const driverRoutes: DriverRoute[] = [];

        // Handle different response formats
        if (response && typeof response === 'object' && 'route' in response && Array.isArray(response.route)) {
            // Format: { route: [ [features], [features] ] }
            const routesArray = response.route;
        
            for (let i = 0; i < routesArray.length; i++) {
                // Ensure driverFeatures is treated as an array of ResponseFeature
                if (Array.isArray(routesArray[i])) {
                    const driverFeatures = routesArray[i] as ResponseFeature[];
                    console.log("Route locations:", driverFeatures);
        
                    const driverStops = driverFeatures.map(feature => {
                        const [lon, lat] = feature.geometry.coordinates;
                        const key = `${lon},${lat}`;
                        const originalMarker = addressMap.get(key);
        
                        return {
                            address: originalMarker?.address ?? feature.properties.address ?? 'Unknown',
                            latitude: lat,
                            longitude: lon,
                            note: originalMarker?.note,
                            arrivalTime: originalMarker?.arrivalTime,
                            departureTime: originalMarker?.departureTime,
                            driverId: feature.properties.driverId ?? i,
                            order: feature.properties.order
                        };
                    });
        
                    driverRoutes.push({
                        driverId: i,
                        stops: driverStops
                    });
                }
            }
        } else if (Array.isArray(response)) {
            // Format: [ [features], [features] ] or [ features ]
            // We need to determine if it's a nested array or a flat array
            
            if (response.length > 0) {
                // Check if the first item is an array to determine the structure
                const isNestedArray = Array.isArray(response[0]);
                
                // Convert to a common format: an array of arrays of features
                const routesArray: ResponseFeature[][] = isNestedArray 
                    ? response as ResponseFeature[][] 
                    : [response as ResponseFeature[]];
        
                for (let i = 0; i < routesArray.length; i++) {
                    const driverFeatures = routesArray[i];
                    console.log("Route locations:", driverFeatures);
        
                    const driverStops = driverFeatures.map(feature => {
                        const [lon, lat] = feature.geometry.coordinates;
                        const key = `${lon},${lat}`;
                        const originalMarker = addressMap.get(key);
        
                        return {
                            address: originalMarker?.address ?? feature.properties.address ?? 'Unknown',
                            latitude: lat,
                            longitude: lon,
                            note: originalMarker?.note,
                            arrivalTime: originalMarker?.arrivalTime,
                            departureTime: originalMarker?.departureTime,
                            driverId: feature.properties.driverId ?? i,
                            order: feature.properties.order
                        };
                    });
        
                    driverRoutes.push({
                        driverId: i,
                        stops: driverStops
                    });
                }
            }
        } else {
            throw new Error("Unexpected response format from backend");
        }

        // For front-end compatibility, also return a single optimized route
        const allStops = driverRoutes.flatMap(route => route.stops);
        const sortedStops = allStops.sort((a, b) => {
            // First sort by driver ID
            if ((a.driverId ?? 0) !== (b.driverId ?? 0)) {
                return (a.driverId ?? 0) - (b.driverId ?? 0);
            }
            // Then by order within each driver's route
            return (a.order ?? 0) - (b.order ?? 0);
        });

        return NextResponse.json({
            routes: driverRoutes,
            totalDrivers: driverRoutes.length,
            route: sortedStops  // For backward compatibility with frontend
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('Error processing request:', errorMessage);
        
        // Make sure to clean up RabbitMQ resources in case of error
        try {
            if (channel) await channel.close();
            if (connection) await connection.close();
        } catch (cleanupError) {
            console.error('Error during connection cleanup:', cleanupError);
        }
        
        return NextResponse.json(
            { error: 'Internal server error', details: errorMessage },
            { status: 500 }
        );
    }
}

// Configure route options using the new App Router syntax
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes in seconds