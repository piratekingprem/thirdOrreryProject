const express = require('express');
const app = express();
const cors = require('cors');
const axios = require('axios');
const methodeOverride = require("method-override");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use(methodeOverride("_method"));
app.use(express.static("public"));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE,PUT,OPTION"
  );
  next();
});
const port = 3001; // Your choice of port


app.get('/api/v1/get_info/:planet', async(req,res)=> {
    const {planet} = req.params;
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `${planet}`;
    const result = await model.generateContent(prompt);
    res.send(result.response.text());
})
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});