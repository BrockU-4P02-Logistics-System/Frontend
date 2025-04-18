'use client'
import Link from 'next/link';
import React from 'react';
import { ChevronRight } from 'lucide-react';
import Head from 'next/head';

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>R E R O U T E</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-white selection:bg-purple-500/10 selection:text-purple-900 flex items-center justify-center flex-col relative">
        {/* Logo and Title in Top Left */}
        <div className="absolute top-4 left-8 z-10">
          <h1 className="text-4xl font-bold text-purple-900">
            REROUTE
          </h1>
        </div>

        {/* Hero Section */}
        <section className="relative pt-12 overflow-hidden bg-white flex items-center justify-center w-full">
          <div className="relative container mx-auto px-8 py-16 md:py-24 flex flex-col items-center justify-center text-center">
            <div className="mb-8">
              {/* Logo centered just below the top */}
              <img
                src="/logo.png"  // Logo path
                alt="Reroute Logo"
                className="h-64 mb-6"  // Logo size doubled (h-64) and moved closer to the top
              />
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-purple-900 mb-8 leading-tight tracking-tight">
              Transform Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-200">Logistics</span> with Enterprise Intelligence
            </h1>
            <p className="text-xl text-purple-900 mb-12 leading-relaxed max-w-2xl font-light">
              Harness the power of our proprietary TSP algorithms to optimize fleet operations, reduce costs, and deliver exceptional customer experiences at scale.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/auth/login">
                <button className="flex items-center px-10 py-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 font-medium">
                  Get Started
                  <ChevronRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* About the Product Section */}
        <section className="mt-24 px-8 py-16">
          <h2 className="text-4xl font-semibold text-center text-purple-900 mb-12">Product Overview</h2>

          {/* Route One Driver Section */}
          <div className="mb-24">
            <h3 className="text-3xl font-semibold text-center text-purple-900 mb-8">Route One Driver</h3>

            {/* Image 1 */}
            <div className="flex mb-12 justify-center items-center gap-8">
              <div className="w-[490px] h-[420px]">
                <img
                  src="/LandingPage.2.1.png"
                  alt="Single Driver Locations"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="w-[490px] h-[420px] flex flex-col justify-center items-center text-center">
                <h4 className="text-2xl font-semibold text-purple-900 mb-4">Add Destinations</h4>
                <p className="text-gray-700">{`Add your locations and generate optimal route.`}</p>
              </div>
            </div>

            {/* Image 2 */}
            <div className="flex mb-12 justify-center items-center gap-8">
              <div className="w-[490px] h-[420px]">
                <img
                  src="/LandingPage.2.2.SingleVehicleRouted.png"
                  alt="Single Driver Map"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="w-[490px] h-[420px] flex flex-col justify-center items-center text-center">
                <h4 className="text-2xl font-semibold text-purple-900 mb-4">View Optimal Route</h4>
                <p className="text-gray-700">{`Optimal route visually represented.`}</p>
              </div>
            </div>

            {/* Image 3 */}
            <div className="flex justify-center items-center gap-8">
              <div className="w-[490px] h-[420px]">
                <img
                  src="/LandingPage.2.3.SingleDriverDirections.png"
                  alt="Single Driver Directions"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="w-[490px] h-[420px] flex flex-col justify-center items-center text-center">
                <h4 className="text-2xl font-semibold text-purple-900 mb-4">View Directions</h4>
                <p className="text-gray-700">{`Take a look at the step-by-step directions and get driving!`}</p>
              </div>
            </div>
          </div>

          {/* Route Multiple Drivers Section */}
          <div>
            <h3 className="text-3xl font-semibold text-center text-purple-900 mb-8">Route Multiple Drivers</h3>

            {/* Image 1 */}
            <div className="flex mb-12 justify-center items-center gap-8">
              <div className="w-[490px] h-[420px]">
                <img
                  src="/LandingPage.2.4.MultiDriverLocations.png"
                  alt="Multiple Drivers Map"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="w-[490px] h-[420px] flex flex-col justify-center items-center text-center">
                <h4 className="text-2xl font-semibold text-purple-900 mb-4">Prepare Route Query</h4>
                <p className="text-gray-700">{`Select 1-10 drivers to be routed, configure route parameters, and add all locations.`}</p>
              </div>
            </div>

            {/* Image 2 */}
            <div className="flex mb-12 justify-center items-center gap-8">
              <div className="w-[490px] h-[420px]">
                <img
                  src="/LandingPage.2.5.MultiDriverMappedRoutes.png"
                  alt="Driver 1 Route"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="w-[490px] h-[420px] flex flex-col justify-center items-center text-center">
                <h4 className="text-2xl font-semibold text-purple-900 mb-4">Multi-Driver Routes Computed and Displayed</h4>
                <p className="text-gray-700">{`Reroute computes the optimal set of routes and displays to the dashboard.`}</p>
              </div>
            </div>

            {/* Image 3 */}
            <div className="flex mb-12 justify-center items-center gap-8">
              <div className="w-[490px] h-[420px]">
                <img
                  src="/LandingPage.2.6.2.2.png"
                  alt="Driver 2 Route"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="w-[490px] h-[420px] flex flex-col justify-center items-center text-center">
                <h4 className="text-2xl font-semibold text-purple-900 mb-4">Select a Driver to View Assigned Directions</h4>
                <p className="text-gray-700">{`All vehicles provided with step-by-step directions`}</p>
              </div>
            </div>

            {/* Image 4 */}
            <div className="flex justify-center items-center gap-8">
              <div className="w-[490px] h-[420px]">
                <img
                  src="/LandingPage.2.7.Driver3.png"
                  alt="Driver 3 Route"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="w-[490px] h-[420px] flex flex-col justify-center items-center text-center">
                <h4 className="text-2xl font-semibold text-purple-900 mb-4">The Nth Driver</h4>
                <p className="text-gray-700">{`Select any driver to view their route.`}</p>
              </div>
            </div>
          </div>
        </section>

        {/* About the Creators Section */}
        <section className="mt-24 px-8 py-16 bg-gray-100">
          <h2 className="text-4xl font-semibold text-center text-purple-900 mb-12">About the Creators</h2>
          <div className="flex flex-col items-center space-y-6">
            <img
              src="/Brock.jpeg"
              alt="Creators image"
              className="w-48 h-48 rounded-full object-contain"
            />
            <p className="text-xl text-center text-purple-900">
              Andrew, Cole, Cam, Travis, Jordan, and Tristan are a team of upper year students at Brock University, ON, Canada. To fulfill the requirements of a Senior Year Software Engineering Project, we have put together this application to expand the capabilities of existing mapping software. Over the course of a semester, we have built REROUTE into a full-fledged mapping product that permits users to route multiple drivers to multiple stops in a near optimal way. We express gratitude to our supervisors who have helped us along the way.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

