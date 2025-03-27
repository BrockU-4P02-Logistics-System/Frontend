import { NextRequest, NextResponse } from 'next/server';
import amqp from 'amqplib';

interface MarkerLocation {
    address: string;
    latitude: number;
    longitude: number;
    note?: string;
    arrivalTime?: string;
    departureTime?: string;
}

interface RouteConfiguration {
    maxSpeed: number;
    weight: number;
    length: number;
    height: number;
    avoidHighways: boolean;
    avoidUnpaved: boolean;
    avoidFerries: boolean;
    avoidTunnels: boolean;
    avoidUTurns: boolean;
    numberDrivers: number;
    returnToStart: boolean;
}

interface RequestBody {
    markers: MarkerLocation[];
    config: RouteConfiguration;
    numberDrivers: number;
    returnToStart: boolean;
}

interface GeoJsonGeometry {
    type: string;
    coordinates: number[];
}

interface GeoJsonProperties {
    address?: string;
    order?: number;
    note?: string;
    arrivalTime?: string;
    departureTime?: string;
}

interface GeoJsonFeature {
    type: string;
    geometry: GeoJsonGeometry;
    properties: GeoJsonProperties;
}

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE_NAME = 'logistic-request';

export async function POST(req: NextRequest) {
    console.log("Received request");
    try {
        const body: RequestBody = await req.json();
        
        // Validate input
        if (!Array.isArray(body.markers)) {
            return NextResponse.json(
                { error: 'Invalid request body: markers array is required' },
                { status: 400 }
            );
        }

        // Convert markers to GeoJSON features
        const features = body.markers.map((marker, index) => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [marker.longitude, marker.latitude]
            },
            properties: {
                address: marker.address,
                order: index,
                note: marker.note,
                arrivalTime: marker.arrivalTime,
                departureTime: marker.departureTime
            },
            numberDrivers: body.numberDrivers || 1, // Default to 1 if not provided
            returnToStart: body.returnToStart || false // Default to false if not provided
        }));

        // Connect to RabbitMQ
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        // Ensure queue exists
        await channel.assertQueue(QUEUE_NAME, {
            durable: true
        });

        // Generate correlation ID
        const correlationId = Math.random().toString() + Date.now().toString();

        // Create response queue
        const { queue: replyTo } = await channel.assertQueue('', {
            exclusive: true
        });

        // Include the new parameters in the message
        const message = {
            features: features,
            numberDrivers: body.numberDrivers || 1, // Default to 1 if not provided
            returnToStart: body.returnToStart || false // Default to false if not provided
        };

        // Send message to queue
        channel.sendToQueue(
            QUEUE_NAME, 
            Buffer.from(JSON.stringify(features)),
            {
                correlationId,
                replyTo,
                contentType: 'application/json'
            }
        );

        // Wait for response with timeout
        const response = await new Promise<GeoJsonFeature[]>((resolve, reject) => {
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('Processing timeout'));
            }, 30000);

            const cleanup = () => {
                clearTimeout(timeout);
                channel.close().catch(console.error);
                connection.close().catch(console.error);
            };

            channel.consume(replyTo, (msg) => {
                if (!msg) return;
                
                if (msg.properties.correlationId === correlationId) {
                    const content = JSON.parse(msg.content.toString()) as GeoJsonFeature[];
                    channel.ack(msg);
                    cleanup();
                    resolve(content);
                } else {
                    channel.nack(msg);
                }
            });
        });

        // Create lookup map for original addresses
        const addressMap = new Map<string, MarkerLocation>();
        body.markers.forEach(marker => {
            const key = `${marker.longitude},${marker.latitude}`;
            addressMap.set(key, marker);
        });

        // Convert response back to MarkerLocation format
        const optimizedRoute = response.map(feature => {
            const [lon, lat] = feature.geometry.coordinates;
            const key = `${lon},${lat}`;
            const originalMarker = addressMap.get(key);
            
            return {
                address: originalMarker?.address ?? 'Unknown',
                latitude: lat,
                longitude: lon,
                note: originalMarker?.note,
                arrivalTime: originalMarker?.arrivalTime,
                departureTime: originalMarker?.departureTime
            };
        });

        return NextResponse.json({ route: optimizedRoute });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('Error processing request:', errorMessage);
        return NextResponse.json(
            { error: 'Internal server error', details: errorMessage },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';