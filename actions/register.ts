"use server"
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";
import fs from 'fs';
import path from 'path';
import * as mongodb from "mongodb";
const { MONGODB_URI } = process.env;


export const register = async (values: any) => {

    const { email, password, username, org_address, org_name, org_phone, org_site } = values;
    var re = new RegExp(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/);
    var re2 = new RegExp(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/);
    try {

        if (!email || !password || !username){ // null check

            return {error: 'One or more fields are empty'}

        }

        if (!re.test(password)){ // Violates reqs

            return {error: 'Invalid password'}

        }

        if (!re2.test(email)){ // Violates reqs

            return {error: 'Invalid email'}

        }

        await connectDB();

        const userFound = await User.findOne({ email });

        if(userFound){

            return {

                error: 'Email already exists!'
            }
        }
        //const hashedPassword = await bcrypt.hash(password, 10);
        let fleet:any[] = [ [
            "Example Car",
            "Driver 1",
            "test@gmail.com"
          ]];
        let credits = 0;
        let routes:any[] = [];

        const user = new User({ // Schema
            username,
            email,
            password,
            org_address,
            org_name,
            org_phone,
            org_site,
            fleet,
            credits,
            routes
        });
        

        await user.save(); // Add to DB

    }catch(e){

        console.log(e);
    }
}

export const register_vehicle = async (values: any) => {

    const {auth, name, driver, email} = values;
    var re = new RegExp(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/);
    var re2 = new RegExp(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/);
    try {

        if (!auth || !driver || !name || !email){ // null check

            return {error: 'One or more fields are empty'}

        }


        if (!re2.test(email)){ // Violates reqs

            return {error: 'Invalid email'}

        }

        await connectDB();

        //const new_vehicle = {fleet: "test"}
        //const new_vehicle_arr = {fleet2: [name, driver, email]}


        await User.findOneAndUpdate({email: auth}, {$push: {fleet: [name, driver, email]}});

        
    }catch(e){

        console.log(e);
    }
}

export const get_fleet = async (auth: any) => {

       try {

         connectDB();

        const data = () => {

            return User.find({email: auth}, {"fleet": 1, "_id": 0}).lean();
        }

        const fleet = JSON.stringify(await data());
        //console.log("GOT: " + fleet);
       //console.log("NEW:" + fleet[0])
        return JSON.stringify(JSON.parse(fleet)[0]);

        
    }catch(e){

        console.log(e);
    }

}

export const remove_vehicle = async (vehicle: any) => {

    try {

        connectDB();

        const data: any = await User.findOneAndUpdate({fleet: [vehicle]}, {$pull: {fleet: vehicle}});

        //const rem = JSON.stringify(data);
        //console.log("removal: " + rem);
       
   }catch(e){

       console.log(e);
   }


}

export const save_route = async(auth:any, input:any, name:any) =>{

    try {

   // const inputPath = path.join('./', 'input.txt');
    //const input = fs.readFileSync(inputPath, 'utf-8');
    //console.log(input);

    //connectDB();

    //const client = mongodb.MongoClient;
    const url: any = MONGODB_URI;

    const client = new mongodb.MongoClient(url);
    await client.connect();
    const db = client.db("reroute");
    const myobj: any = JSON.parse(input);
    var route = (await db.collection("routes").insertOne(myobj)).insertedId;
   
    //console.log(route);

     await User.findOneAndUpdate({email: auth}, {$push: {routes: [name, route]}});

    //var id = '67cb5d55570913c32d9e1550';
   // var query = { _id: new mongodb.ObjectId(id)};
    var doc = await db.collection("routes").findOne(route); // Find route by id
    //console.log(doc);

    
    client.close();

    }catch(e){

        console.log(e);
    }
}

export const get_routes = async (auth: any) => {

    try {

      connectDB();

     const data = () => {

         return User.find({email: auth}, {"routes": 1, "_id": 0}).lean();
     }

     const routes = JSON.stringify(await data());
    //console.log("GOT: " + routes);
    //console.log("NEW:" + JSON.stringify(JSON.parse(routes)[0]))
     return JSON.stringify(JSON.parse(routes)[0]);

     
 }catch(e){

     console.log(e);
 }

}
 
export const remove_route = async (auth:any, name:any, route:any) => {

    try {

        connectDB();
        const url: any = MONGODB_URI;

        const client = new mongodb.MongoClient(url);
        await client.connect();
        const db = client.db("reroute");
        var query =  new mongodb.ObjectId(route);

        const user_route = await User.findOneAndUpdate({email: auth}, {$pull: {routes: [name, query]}});
        const route_route = await db.collection("routes").deleteOne(query); // Find route by id
        //console.log("User: " + user_route);
        //console.log("Route: " + route_route);
       
   }catch(e){

       console.log(e);
   }


}

export const load_route = async (routeID: any) => {

    try {

        connectDB();
        const url: any = MONGODB_URI;

        const client = new mongodb.MongoClient(url);
        await client.connect();
        const db = client.db("reroute");
        var query =  new mongodb.ObjectId(routeID);

        const data = await db.collection("routes").findOne(query, { projection: {_id: 0 } });
        const config = await db.collection("routes").findOne(query, { projection: { config: 1, _id: 0 } });
        const markers = await db.collection("routes").findOne(query, { projection: { markers: 1, _id: 0 } });
        const routePath = await db.collection("routes").findOne(query, { projection: { routePath: 1, _id: 0 } });
        const routeDirections = await db.collection("routes").findOne(query, { projection: { routeDirections: 1, _id: 0 } });
        const totalRouteDistance = await db.collection("routes").findOne(query, { projection: { totalRouteDistance: 1, _id: 0 } });
        const totalRouteDuration = await db.collection("routes").findOne(query, { projection: { totalRouteDuration: 1, _id: 0 } });
        const timestamp = await db.collection("routes").findOne(query, { projection: { timestamp: 1, _id: 0 } });
/*
        localStorage.setItem('savedConfig', JSON.stringify(config));
        localStorage.setItem('savedMarkers', JSON.stringify(markers));
        localStorage.setItem('savedRoutePath', JSON.stringify(routePath));
        localStorage.setItem('savedRouteDirections', JSON.stringify(routeDirections));
        localStorage.setItem('savedRouteDistance', JSON.stringify(totalRouteDistance));
        localStorage.setItem('savedRouteDuration', JSON.stringify(totalRouteDuration));
        localStorage.setItem('savedTimestamp', JSON.stringify(timestamp));
        */

        const route_arr = [

            JSON.stringify(data), 
            JSON.stringify(config), 
            JSON.stringify(markers), 
            JSON.stringify(routePath), 
            JSON.stringify(routeDirections), 
            JSON.stringify(totalRouteDistance), 
            JSON.stringify(totalRouteDuration), 
            JSON.stringify(timestamp)

        ];

        const route = JSON.stringify(data);
        //console.log("DB: " + route);
        //console.log("NEW:" + JSON.stringify(JSON.parse(route)[0]))
        return route_arr;

     
 }catch(e){

     console.log(e);
 }

}

export const num_routes = async (auth: any) => {

    try {

        connectDB();

        const num = await User.find({email: auth}, {_id: 0, routes: 1});
       //console.log(num[0].length)
       
        if (num[0].routes.length < 6){

            return true;

        } else {

            return false;
            
        }
     
 }catch(e){

     console.log(e);
 }



}


export const add_credits = async(auth: any, increment:number) => {

    try {

        connectDB();

        const data: any = await User.findOneAndUpdate({email: auth}, {$inc: {credits: increment}});

        //const rem = JSON.stringify(data);
        //console.log("credits: " + rem);
       
   }catch(e){

       console.log(e);
   }

}

export const check_credits = async(auth: any) => {

    try {

        connectDB();

        const data = () => {

            return User.findOne({email: auth}, {"credits": 1, "_id": 0}).lean();
        }

        const credits = JSON.stringify(await data());
        //console.log("GOT: " + credits);
        const match:any = credits.match(/(\d+)/g);
       //console.log("NEW:" + match);
       //console.log(match[0]);
        const value:number = match[0];
        return value;

       
   }catch(e){

       console.log(e);
   }

}

export const remove_credits = async(auth: any, increment:number) =>{

    try {

        connectDB();

        const data: any = await User.findOneAndUpdate({email: auth}, {$inc: {credits: increment}});

        //const rem = JSON.stringify(data);
        //console.log("credits: " + rem);
       
   }catch(e){

       console.log(e);
   }



}

