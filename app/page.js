"use client";
import React, { useState, useEffect } from "react";
import {
  Truck,
  BarChart,
  Route,
  ChevronRight,
  Menu,
  X,
  Globe,
  Zap,
  Users,
} from "lucide-react";

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white selection:bg-I-500/10 selection:text-blue-900">
      {/* Navbar */}
      <nav
        className={`fixed w-full z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-8">
          <div className="flex items-center justify-between h-24">
            <div className="flex items-center">
              <span
                className={`text-3xl font-bold tracking-tight ${
                  isScrolled ? "text-blue-900" : "text-white"
                }`}
              >
                Reroute<span className="text-blue-500">.</span>
              </span>
            </div>

            <div className="hidden lg:flex items-center space-x-10">
              <NavLink href="#solutions" scrolled={isScrolled}>
                Solutions
              </NavLink>
              <NavLink href="#platform" scrolled={isScrolled}>
                Platform
              </NavLink>
              <a href="/auth/login">
                <button className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 font-medium">
                  Get Started
                </button>
              </a>
            </div>

            <button
              className="lg:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X
                  className={`w-6 h-6 ${
                    isScrolled ? "text-blue-900" : "text-white"
                  }`}
                />
              ) : (
                <Menu
                  className={`w-6 h-6 ${
                    isScrolled ? "text-blue-900" : "text-white"
                  }`}
                />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
          <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] mix-blend-overlay opacity-20"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(29,78,216,0.1),transparent_50%)]"></div>
        </div>

        <div className="relative container mx-auto px-8 py-32 md:py-40">
          <div className="max-w-4xl">
            <div className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-blue-500/10 text-blue-200 mb-10 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-sm font-medium tracking-wide">
                Now with real-time traffic optimization
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight tracking-tight">
              Transform Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">
                Logistics
              </span>{" "}
              with Enterprise Intelligence
            </h1>
            <p className="text-xl text-blue-100/90 mb-12 leading-relaxed max-w-2xl font-light">
              Harness the power of our proprietary TSP algorithms to optimize
              fleet operations, reduce costs, and deliver exceptional customer
              experiences at scale.
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
              <a href="/auth/login">
                <button className="group inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300">
                  Sign Up
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </a>
              <button className="inline-flex items-center px-8 py-4 rounded-full border-2 border-white/10 text-white font-medium hover:bg-white/10 backdrop-blur-sm transition-all duration-300">
                Watch Demo
              </button>
            </div>

            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-12">
              <StatCard label="Routable Cities" value="25K+" />
              <StatCard label="Cost Reduction" value="90%" />
              <StatCard label="Faster Routing" value="X7" />
              <StatCard label="Canadian" value="100%" />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent"></div>
      </section>

      {/* Features Section */}
      <section className="py-32" id="solutions">
        <div className="container mx-auto px-8">
          <SectionHeader
            title={
              <>
                Intelligent Route{" "}
                <span className="text-blue-600">Optimization</span>
              </>
            }
            subtitle="Powered by advanced algorithms"
            description="Our enterprise platform leverages cutting-edge technology to transform complex logistics challenges into optimized delivery routes."
          />

          <div className="mt-20 grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Globe className="w-8 h-8" />}
              title="North American Routing"
              description="Handle millions of delivery points across North America with our distributed computing infrastructure."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Real-time Updates"
              description="Adapt to changing conditions with dynamic route recalculation and instant driver notifications."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Team Collaboration"
              description="Enable seamless coordination between dispatchers, drivers, and management with role-based access."
            />
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <section className="py-32 bg-gray-50/50" id="platform">
        <div className="container mx-auto px-8">
          <SectionHeader
            title={
              <>
                Enterprise-grade <span className="text-blue-600">Platform</span>
              </>
            }
            subtitle="Built for scale"
            description="A comprehensive solution that grows with your business needs while maintaining peak performance."
          />

          <div className="mt-20 grid lg:grid-cols-2 gap-16">
            <div className="space-y-12">
              <PlatformFeature
                icon={<Route className="w-6 h-6" />}
                title="Advanced TSP Algorithm"
                description="Our proprietary algorithms process complex constraints to find optimal routes while considering multiple variables."
              />
              <PlatformFeature
                icon={<Truck className="w-6 h-6" />}
                title="Real-time Fleet Management"
                description="Track and manage your entire fleet with live updates, predictive ETAs, and intelligent dispatch."
              />
              <PlatformFeature
                icon={<BarChart className="w-6 h-6" />}
                title="Analytics & Insights"
                description="Make data-driven decisions with comprehensive analytics and customizable reporting dashboards."
              />
            </div>
            <div className="relative">
              <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/20 rotate-1 hover:rotate-0 transition-transform duration-500">
                <img
                  src="/image.png"
                  alt="Platform interface"
                  className="object-cover w-full h-full"
                />
              </div>
              {/* <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent rounded-2xl -rotate-1"></div> */}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-blue-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] mix-blend-overlay opacity-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="container mx-auto px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              Ready to Transform Your Logistics Operations?
            </h2>
            <p className="text-xl text-blue-200/90 mb-12 font-light">
              Join industry leaders in revolutionizing delivery operations with
              our enterprise routing solution.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a href="/auth/login">
                <button className="group inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300">
                  Get Started
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-white py-20">
        <div className="container mx-auto px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-16">
            <div>
              <h3 className="text-2xl font-bold mb-6 tracking-tight">
                Reroute<span className="text-blue-500">.</span>
              </h3>
              <p className="text-gray-400 mb-8 font-light">
                Enterprise-grade routing solutions for modern logistics
                operations.
              </p>
            </div>
            <FooterLinks title="Product" links={["Solutions", "Platform"]} />
            <FooterLinks title="Company" links={["Contact"]} />
            <FooterLinks title="Resources" links={["Documentation", "Demo"]} />
          </div>
          <div className="border-t border-gray-900 mt-16 pt-8 text-center text-gray-500">
            <p>&copy; 2025 Reroute. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Navigation Components
const NavLink = ({ href, children, scrolled }) => (
  <a
    href={href}
    className={`font-medium hover:text-blue-600 transition-colors ${
      scrolled ? "text-gray-700" : "text-white"
    }`}
  >
    {children}
  </a>
);

// Stat Card Component
const StatCard = ({ label, value }) => (
  <div className="group relative">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-xl -z-10 group-hover:scale-105 transition-transform duration-300"></div>
    <p className="text-4xl font-bold mb-2 bg-gradient-to-br from-white to-blue-100 bg-clip-text text-transparent">
      {value}
    </p>
    <p className="text-blue-200/90 text-sm font-medium tracking-wide">
      {label}
    </p>
  </div>
);

// Section Header Component
const SectionHeader = ({ title, subtitle, description }) => (
  <div className="max-w-3xl mx-auto text-center">
    <span className="inline-block text-blue-600 font-medium mb-4 text-sm tracking-wider uppercase">
      {subtitle}
    </span>
    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
      {title}
    </h2>
    <p className="text-gray-600 text-lg font-light leading-relaxed">
      {description}
    </p>
  </div>
);

// Feature Card Component
const FeatureCard = ({ icon, title, description }) => (
  <div className="group p-8 bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500/10 to-blue-600/5 text-blue-600 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
    <p className="text-gray-600 leading-relaxed font-light">{description}</p>
  </div>
);

// Platform Feature Component
const PlatformFeature = ({ icon, title, description }) => (
  <div className="group relative pl-12">
    <div className="absolute left-0 top-0 p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 text-blue-600 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed font-light">{description}</p>
  </div>
);

// Footer Links Component
const FooterLinks = ({ title, links }) => {
  const linkMap = {
    Solutions: "#solutions",
    Platform: "#platform",
    Contact: "mailto:support@re-route.ca",
    Documentation: "/docs",
    Guides: "/guides",
  };

  return (
    <div>
      <h4 className="text-lg font-semibold mb-4">{title}</h4>
      <ul className="space-y-2 text-gray-400 text-sm">
        {links.map((link) => (
          <li key={link}>
            <a
              href={linkMap[link] || "#"}
              className="hover:text-white transition-colors"
            >
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
