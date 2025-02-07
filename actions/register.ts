"use server"
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const register = async (values: any) => {
    const { email, password, username } = values;

    try {

        if (!email || !password || !username){

            return {error: 'One or more fields are empty'}

        }

        await connectDB();
        const userFound = await User.findOne({ email });
        if(userFound){
            return {
                error: 'Email already exists!'
            }
        }
        //const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            email,
            password
        });
        

        await user.save();

    }catch(e){
        console.log(e);
    }
}
