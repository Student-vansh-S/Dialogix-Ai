import express from "express";
import Thread from "../models/Threads.js";
import getOpenAIAPIResponse from "../utils/openAi.js";

const router = express.Router();

//Test
router.post("/test",async(req ,res)=>{
    try{
        const thread = new Thread({
            threadId:"demo",
            title:"What is computer?"
        });
        const response = await thread.save();
        res.send(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Failed to save in DB"});
    }
});

//Get all Threads
router.get("/thread",async(req ,res)=>{
    try{
        const threads = await Thread.find({}).sort({updatedAt:-1}) //Descending order of UpadatedAt...most recent data on top
        res.json(threads);
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Failed to fetch threads"});
    }
});

//Particular thread select by threadID
router.get("/thread/:threadId",async(req ,res)=>{
    const {threadId} = req.params;
    try{
        const thread = await Thread.findOne({threadId});
        if(!thread){
            res.status(404).json({error:"Thread not found"});
        }
        res.json(thread.messages);
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Failed to fetch chat"});
    }
});

//delete thread
router.delete("/thread/:threadId",async(req ,res)=>{
    const {threadId} = req.params;
    try{
        const deletedThread = await Thread.findOneAndDelete({threadId});
        if(!deletedThread){
            return res.status(404).json({error:"Thread not found"});
        }
        res.status(200).json({sucess:"Thread deleted sucessfully"});
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Failed to fetch chat"});
    }
});

//genrate new thread or work with exsisting threads
router.post("/chat",async(req,res)=>{
    const {threadId,message}= req.body;
    if(!threadId || !message){
        res.status(400).json({error:"missing required fields"}); 
    }
    try{
        let thread = await Thread.findOne({threadId});
        if(!thread){
            thread = new Thread({
                threadId,
                title:message,
                messages:[{role:"user",content:message}]
            });
        }else{
            thread.messages.push({role:"user",content:message});
        }

        const assistantReply = await getOpenAIAPIResponse(message);

        thread.messages.push({role:"assistant", content:assistantReply});
        thread.updatedAt = new Date();

        await thread.save();
        res.json({reply:assistantReply});
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Somthing went Wrong!"});
    }
}) 
export default router;