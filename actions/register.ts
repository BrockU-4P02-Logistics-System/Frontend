"use server"
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";

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
        const fleet = '';

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
       //console.log("NEW:" + JSON.stringify(JSON.parse(fleet)[0]))
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
