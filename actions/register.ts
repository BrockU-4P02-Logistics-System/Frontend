"use server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import * as mongodb from "mongodb";
const { MONGODB_URI } = process.env;

export const register = async (values: any) => {
  let {
    email,
    password,
    username,
    org_address,
    org_name,
    org_phone,
    org_site,
  } = values;
  email = email.toLowerCase();
  var re = new RegExp(
    /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/
  );
  var re2 = new RegExp(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/);
  try {
    if (!email || !password || !username) {
      // null check

      return { error: "One or more fields are empty" };
    }

    if (!re.test(password)) {
      // Violates reqs

      return { error: "Invalid password" };
    }

    if (!re2.test(email)) {
      // Violates reqs

      return { error: "Invalid email" };
    }

    await connectDB();

    const userFound = await User.findOne({ email });

    if (userFound) {
      return {
        error: "Email already exists!",
      };
    }
    //const hashedPassword = await bcrypt.hash(password, 10);
    let fleet: any[] = [["Example Car", "Driver 1", "test@gmail.com"]];
    let credits = 0;
    let routes: any[] = [];

    const user = new User({
      // Schema
      username,
      email,
      password,
      org_address,
      org_name,
      org_phone,
      org_site,
      fleet,
      credits,
      routes,
    });

    await user.save(); // Add to DB
  } catch (e) {
    console.log(e);
  }
};

export const register_vehicle = async (values: any) => {
  const { auth, name, driver, email } = values;
  var re = new RegExp(
    /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/
  );
  var re2 = new RegExp(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/);
  try {
    if (!auth || !driver || !name || !email) {
      // null check

      return { error: "One or more fields are empty" };
    }

    if (!re2.test(email)) {
      // Violates reqs

      return { error: "Invalid email" };
    }

    await connectDB();

    //const new_vehicle = {fleet: "test"}
    //const new_vehicle_arr = {fleet2: [name, driver, email]}

    await User.findOneAndUpdate(
      { email: auth },
      { $push: { fleet: [name, driver, email] } }
    );
  } catch (e) {
    console.log(e);
  }
};

export const get_fleet = async (auth: any) => {
  try {
    connectDB();

    const data = () => {
      return User.find({ email: auth }, { fleet: 1, _id: 0 }).lean();
    };

    const fleet = JSON.stringify(await data());
    //console.log("GOT: " + fleet);
    //console.log("NEW:" + fleet[0])
    return JSON.stringify(JSON.parse(fleet)[0]);
  } catch (e) {
    console.log(e);
  }
};

export const remove_vehicle = async (vehicle: any) => {
  try {
    connectDB();

    const data: any = await User.findOneAndUpdate(
      { fleet: [vehicle] },
      { $pull: { fleet: vehicle } }
    );

    //const rem = JSON.stringify(data);
    //console.log("removal: " + rem);
  } catch (e) {
    console.log(e);
  }
};

export const save_route = async (auth: any, input: any, name: any) => {
  try {
    const url: any = MONGODB_URI;
    const client = new mongodb.MongoClient(url);
    await client.connect();
    const db = client.db("reroute");
    
    // Parse the input data
    const routeData = JSON.parse(input);
    
    // Create a trimmed version that excludes large coordinate arrays
    // but preserves direction information
    const trimmedData = {
      // Keep essential metadata
      timestamp: routeData.timestamp,
      config: routeData.config,
      numDrivers: routeData.numDrivers,
      
      // Keep markers (stops) as they're essential and relatively small
      markers: routeData.markers,
      
      // For driver routes, keep all essential data except coordinate arrays
      driverRoutes: routeData.driverRoutes?.map((route: any) => ({
        driverId: route.driverId,
        markers: route.markers,
        totalDistance: route.totalDistance,
        totalDuration: route.totalDuration,
        color: route.color,
        directions: route.directions,
        // Set empty arrays for coordinates - these will be regenerated on load
        routePath: [], 
        straightLinePaths: []
      }))
    };
    
    // Save the trimmed data to MongoDB
    var route = (await db.collection("routes").insertOne(trimmedData)).insertedId;
    
    // Update the user's routes list
    await User.findOneAndUpdate(
      { email: auth },
      { $push: { routes: [name, route] } }
    );

    client.close();
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
};
export const get_routes = async (auth: any) => {
  try {
    connectDB();

    const data = () => {
      return User.find({ email: auth }, { routes: 1, _id: 0 }).lean();
    };

    const routes = JSON.stringify(await data());
    //console.log("GOT: " + routes);
    //console.log("NEW:" + JSON.stringify(JSON.parse(routes)[0]))
    return JSON.stringify(JSON.parse(routes)[0]);
  } catch (e) {
    console.log(e);
  }
};

export const remove_route = async (auth: any, name: any, route: any) => {
  try {
    connectDB();
    const url: any = MONGODB_URI;

    const client = new mongodb.MongoClient(url);
    await client.connect();
    const db = client.db("reroute");
    var query = new mongodb.ObjectId(route);

    const user_route = await User.findOneAndUpdate(
      { email: auth },
      { $pull: { routes: [name, query] } }
    );
    const route_route = await db.collection("routes").deleteOne(query); // Find route by id
    //console.log("User: " + user_route);
    //console.log("Route: " + route_route);
  } catch (e) {
    console.log(e);
  }
};

export const load_route = async (routeID: any) => {
  try {
    connectDB();
    const url: any = MONGODB_URI;

    const client = new mongodb.MongoClient(url);
    await client.connect();
    const db = client.db("reroute");
    var query = new mongodb.ObjectId(routeID);

    // Get the full route document without _id field
    const data = await db
      .collection("routes")
      .findOne(query, { projection: { _id: 0 } });
    
    if (!data) {
      throw new Error("Route not found");
    }
    
    // No need to modify the data - it already has the empty arrays
    // for routePath and straightLinePaths from when it was saved
    // And it preserves all the direction information
    
    const route_arr = [
      JSON.stringify(data),
      JSON.stringify({ markers: data.markers }),
      JSON.stringify({ config: data.config }),
      JSON.stringify({ driverRoutes: data.driverRoutes }),
      JSON.stringify({ numDrivers: data.numDrivers }),
      JSON.stringify({ timestamp: data.timestamp }),
    ];

    client.close();
    return route_arr;
  } catch (e) {
    console.log(e);
    return [];
  }
};

export const num_routes = async (auth: any) => {
  try {
    connectDB();

    const num = await User.find({ email: auth }, { _id: 0, routes: 1 });
    //console.log(num[0].length)

    if (num[0].routes.length < 6) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    console.log(e);
  }
};

export const add_credits = async (auth: any, increment: number) => {
  try {
    connectDB();

    const data: any = await User.findOneAndUpdate(
      { email: auth },
      { $inc: { credits: increment } }
    );

    console.log(check_credits(auth));
    //const rem = JSON.stringify(data);
    //console.log("credits: " + rem);
  } catch (e) {
    console.log(e);
  }
};

export const check_credits = async (auth: any) => {
  try {
    connectDB();

    const data = () => {
      return User.findOne({ email: auth }, { credits: 1, _id: 0 }).lean();
    };

    const credits = JSON.stringify(await data());
    //console.log("GOT: " + credits);
    const match: any = credits.match(/(\d+)/g);
    //console.log("NEW:" + match);
    //console.log(match[0]);
    const value: number = match[0];
    return value;
  } catch (e) {
    console.log(e);
  }
};

export const remove_credits = async (auth: any, increment: number) => {
  try {
    connectDB();

    const data: any = await User.findOneAndUpdate(
      { email: auth },
      { $inc: { credits: increment } }
    );

    //const rem = JSON.stringify(data);
    //console.log("credits: " + rem);
  } catch (e) {
    console.log(e);
  }
};
