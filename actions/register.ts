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
        let fleet:any[] = [];

        const user = new User({ // Schema
            username,
            email,
            password,
            org_address,
            org_name,
            org_phone,
            org_site,
            fleet
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

export const save_route = async() =>{

    try {

    const inputPath = path.join('./', 'input.txt');
    const input = fs.readFileSync(inputPath, 'utf-8');
    //console.log(input);

    //connectDB();

    //const client = mongodb.MongoClient;
    const url: any = MONGODB_URI;

    const client = new mongodb.MongoClient(url);
    await client.connect();
    const db = client.db("reroute");
    const myobj: any = JSON.parse(input);
    await db.collection("routes").insertOne(myobj);
    console.log("1 document inserted");


    var id = '67cb5d55570913c32d9e1550';
    var query = { _id: new mongodb.ObjectId(id)};
    var doc = await db.collection("routes").findOne(query);

    console.log(doc);

    client.close();

    }catch(e){

        console.log(e);
    }
}
