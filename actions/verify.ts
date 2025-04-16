"use server"
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export const verify = async (values: any) => {

    let { email } = values;
    email = email.toLowerCase();

    try {

        await connectDB();
        
        const userFound = await User.findOne({ email });
        
        if(userFound){

            return true;

        } else {

            return false;

        }

    }catch(e){

        console.log(e);
    }
}
