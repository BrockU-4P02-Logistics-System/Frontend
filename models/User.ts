import { Schema, model,  models} from  "mongoose";
import bcrypt from "bcryptjs"

export interface UserDocument {

    _id: string;

    username: string

    password: string

    email: string

    org_name: string

    org_address: string

    org_phone: string

    org_site: string


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

        required: [true, "Password is required"],

        match: [

           /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/,

            "Password must contain one digit from 1 to 9, one lowercase letter, one uppercase letter, one special character, no space, and it must be 8-16 characters long.",


        ]

    },

    org_name: {type: String, required: false},
    org_address: {type: String, required: false},
    org_phone: {type: String, required: false},
    org_site: {type: String, required: false},

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
