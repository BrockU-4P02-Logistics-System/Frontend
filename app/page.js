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

      <div className="min-h-screen bg-white selection:bg-purple-500/10 selection:text-purple-900 flex items-center justify-center">
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
      </div>
    </>
  );
}

