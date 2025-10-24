import mongoose from "mongoose"



export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI)
        console.log(`MognoDB Connected: ${conn.connection.host}`)
    } catch (error) {
        console.log("Error in connecting in MongoDB", error)
        process.exit(1); // 1 means failure 
    }
}