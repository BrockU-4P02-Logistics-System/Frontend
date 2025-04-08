import { NextRequest, NextResponse } from "next/server";
import amqp from "amqplib";

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

const RABBITMQ_URL = "amqp://cole:corbett@132.145.102.107:5672";
const QUEUE_NAME = "logistic-request";

export async function POST(req: NextRequest) {
  console.log("Received request");
  try {
    const body: RequestBody = await req.json();

    // Validate input
    if (!Array.isArray(body.features)) {
      return NextResponse.json(
        { error: "Invalid request body: features array is required" },
        { status: 400 }
      );
    }

    console.log("Converting features");

    // Convert markers to GeoJSON features
    const features = body.features.map((marker, index) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [marker.longitude, marker.latitude],
      },
      properties: {
        address: marker.address,
        order: marker.order || index + 1,
        driverId: marker.driverId, // Preserve the driver ID
        note: marker.note,
        arrivalTime: marker.arrivalTime,
        departureTime: marker.departureTime,
      },
    }));

    // Connect to RabbitMQ
    console.log("Connecting to RabbitMQ");
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    console.log("Connected to RabbitMQ");

    // Ensure queue exists
    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
    });

    // Generate correlation ID
    const correlationId = Math.random().toString() + Date.now().toString();

    // Create response queue and clear out any stale messages
    const { queue: replyTo } = await channel.assertQueue("", {
      exclusive: true,
    });
    await channel.purgeQueue(replyTo);

    // Ensure there's at least 1 driver
    const numberDrivers = body.numberDrivers || 1;

    // Group features by driver ID if they already have assignments
    const driverFeatures = new Map<number, GeoJsonFeature[]>();
    let hasPreassignedDrivers = false;

    features.forEach((feature) => {
      const driverId = feature.properties.driverId;
      if (driverId !== undefined) {
        hasPreassignedDrivers = true;
        if (!driverFeatures.has(driverId)) {
          driverFeatures.set(driverId, []);
        }
        driverFeatures.get(driverId)?.push(feature);
      }
    });

    // Include the parameters in the message
    const message = {
      features: features,
      numberDrivers: hasPreassignedDrivers
        ? driverFeatures.size
        : numberDrivers,
      returnToStart: body.returnToStart || false,
      // Include driver assignments if available
      preassignedDrivers: hasPreassignedDrivers
        ? Array.from(driverFeatures.entries()).map(([driverId, features]) => ({
            driverId,
            featureIndices: features.map((f) => features.indexOf(f)),
          }))
        : undefined,
    };

    console.log(
      "Sending message to queue:",
      JSON.stringify(message).substring(0, 200) + "..."
    );

    // Send message to queue
    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(message)), {
      correlationId,
      replyTo,
      contentType: "application/json",
    });

    const response: any = await new Promise((resolve, reject) => {
      let timeout: NodeJS.Timeout;

      const cleanup = () => {
        clearTimeout(timeout);
        channel.close().catch(console.error);
        connection.close().catch(console.error);
      };

      timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Processing timeout"));
      }, 30000);

      channel.consume(replyTo, (msg) => {
        if (!msg) return;

        if (msg.properties.correlationId !== correlationId) {
          // For messages that don't belong to this request,
          // simply acknowledge them to clear them out.
          channel.ack(msg);
          return;
        }

        try {
          const content = JSON.parse(msg.content.toString());
          console.log("Received response from backend:", content);
          if (content?.error) {
            throw new Error(`Backend error: ${content.error}`);
          }
          channel.ack(msg);
          cleanup();
          resolve(content);
        } catch (err) {
          console.error("Error parsing backend response:", err);
          // Acknowledge even on error so the message isn't requeued.
          channel.ack(msg);
          cleanup();
          reject(err);
        }
      });
    });

    // Create lookup map for original addresses and data
    const addressMap = new Map<string, MarkerLocation>();
    body.features.forEach((marker) => {
      const key = `${marker.longitude},${marker.latitude}`;
      addressMap.set(key, marker);
    });

    // Process the response
    let driverRoutes: DriverRoute[] = [];

    // Handle different response formats
    if (response.route && Array.isArray(response.route)) {
      // Format: { route: [ [features], [features] ] }
      const routesArray = response.route;

      for (let i = 0; i < routesArray.length; i++) {
        const driverFeatures = routesArray[i];
        console.log("Route locations:", driverFeatures);

        const driverStops = driverFeatures.map((feature: GeoJsonFeature) => {
          const [lon, lat] = feature.geometry.coordinates;
          const key = `${lon},${lat}`;
          const originalMarker = addressMap.get(key);

          return {
            address:
              originalMarker?.address ??
              feature.properties.address ??
              "Unknown",
            latitude: lat,
            longitude: lon,
            note: originalMarker?.note ?? feature.properties.note,
            arrivalTime:
              originalMarker?.arrivalTime ?? feature.properties.arrivalTime,
            departureTime:
              originalMarker?.departureTime ?? feature.properties.departureTime,
            driverId: feature.properties.driverId ?? i,
            order: feature.properties.order,
          };
        });

        driverRoutes.push({
          driverId: i,
          stops: driverStops,
        });
      }
    } else if (Array.isArray(response)) {
      // Format: [ [features], [features] ] or [ features ]
      const routesArray = Array.isArray(response[0]) ? response : [response];

      for (let i = 0; i < routesArray.length; i++) {
        const driverFeatures = routesArray[i];
        console.log("Route locations:", driverFeatures);

        const driverStops = driverFeatures.map((feature: GeoJsonFeature) => {
          const [lon, lat] = feature.geometry.coordinates;
          const key = `${lon},${lat}`;
          const originalMarker = addressMap.get(key);

          return {
            address:
              originalMarker?.address ??
              feature.properties.address ??
              "Unknown",
            latitude: lat,
            longitude: lon,
            note: originalMarker?.note ?? feature.properties.note,
            arrivalTime:
              originalMarker?.arrivalTime ?? feature.properties.arrivalTime,
            departureTime:
              originalMarker?.departureTime ?? feature.properties.departureTime,
            driverId: feature.properties.driverId ?? i,
            order: feature.properties.order,
          };
        });

        driverRoutes.push({
          driverId: i,
          stops: driverStops,
        });
      }
    } else {
      throw new Error("Unexpected response format from backend");
    }

    // For front-end compatibility, also return a single optimized route
    const allStops = driverRoutes.flatMap((route) => route.stops);
    const sortedStops = allStops.sort((a, b) => {
      // First sort by driver ID
      if ((a.driverId ?? -1) !== (b.driverId ?? -1)) {
        return (a.driverId ?? -1) - (b.driverId ?? -1);
      }
      // Then by order within each driver's route
      return (a.order || 0) - (b.order || 0);
    });

    return NextResponse.json({
      routes: driverRoutes,
      totalDrivers: driverRoutes.length,
      route: sortedStops, // For backward compatibility with frontend
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Error processing request:", errorMessage);
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
