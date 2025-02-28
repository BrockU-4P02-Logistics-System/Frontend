"use server"
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export const register = async (values: any) => {

    const { email, password, username } = values;
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

        const user = new User({ // Schema
            username,
            email,
            password
        });
        

        await user.save(); // Add to DB

    }catch(e){

        console.log(e);
    }
}
