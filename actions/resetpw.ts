"use server"
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const checkmail = async (values: any) => {
    const { email} = values;

    try {
        await connectDB();
        const userFound = await User.findOne({ email });
        if(!userFound){
            return {
                error: 'Email not found in database'
            }
        } else {

            return {

            ok: 'Email found'

            }
        }
       

    }catch(e){
        console.log(e);
    }
}
