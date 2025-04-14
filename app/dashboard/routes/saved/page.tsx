'use client';
import React, { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from 'next-auth/react';
import { get_routes, remove_route, load_route } from "@/actions/register";
import { useRouter } from 'next/navigation';

type RouteTuple = [string, string]; // [routeName, routeId]

export default function SavedRoutes() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [data, setData] = useState<RouteTuple[]>([]);

    const userEmail = session?.user?.email;

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/login");
        } else if (status === "authenticated") {
            refresh();
        }
    }, [status, router]);

    const remove = async (route: RouteTuple) => {
        if (!userEmail) return;
        await remove_route(userEmail, route[0], route[1]);
        refresh();
    };

    const load = async (routeId: string) => {
        const result = await load_route(routeId);

        if (!result || result.length === 0) {
            console.error("Failed to load route:", routeId);
            return;
        }

        const parsed = JSON.parse(result[0]);
        sessionStorage.setItem('savedLoadedRoute', result[0]);
        sessionStorage.setItem('savedConfig', JSON.stringify(parsed.config));
        sessionStorage.setItem('savedMarkers', JSON.stringify(parsed.markers));
        sessionStorage.setItem('savedDriverRoutes', JSON.stringify(parsed.driverRoutes));
        sessionStorage.setItem('savedNumDrivers', JSON.stringify(parsed.numDrivers));
        sessionStorage.setItem('savedTimestamp', JSON.stringify(parsed.timestamp));

        return router.push("/dashboard?load=true");
    };

    const refresh = async () => {
        const email = session?.user?.email;
        if (!email) return;

        const listJson = await get_routes(email);

        // Check if listJson is defined before parsing
        if (!listJson) {
            console.error("Failed to get routes");
            return;
        }

        const parsed = JSON.parse(listJson) as { routes: RouteTuple[] };
        setData(Array.from(parsed.routes));
    };


    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Saved Routes</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.map((route) => (
                    <Card key={route[0]} className="relative">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-medium">{route[0]}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" onClick={() => load(route[1])}>
                                Load Route
                            </Button>
                            <Button variant="outline" onClick={() => remove(route)}>
                                Delete Route
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}