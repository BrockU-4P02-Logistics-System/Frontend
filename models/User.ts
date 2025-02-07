import { Schema, model,  models} from  "mongoose";
import bcrypt from "bcryptjs"

export interface UserDocument {

    _id: string;

    username: string

    password: string

    email: string


}

const UserSchema = new Schema<UserDocument>({

    email: {

        type: String,

        unique: true,

        required: [true, "Email is required"],

        match: [

          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,

                                            "Email is invalid",

        ],

    },


    username: {

        type: String,

        required: [true, "Username is required"]

    },

    password: {

        type: String,

        required: true

    }

})

UserSchema.pre("save", function(next) {

    const user = this;
 
    if (this.isModified("password") || this.isNew){

     bcrypt.genSalt(10, function (saltError: any, salt: any){

        if (saltError){

            return next(saltError);

        } else {

            bcrypt.hash(user.password, salt, function (hashError: any, hash: any) {

                if (hashError){

                    return next(hashError);

                }

                user.password = hash
                next();

            })


        }


     })


    } else {

        return next();

    }
 
 
 })



const  User  =  models.User  ||  model<UserDocument>('User', UserSchema);

export  default  User;
