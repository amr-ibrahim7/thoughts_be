import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/dbConnection.js";
import postsRouter from "./routes/post.routes.js";
import usersRouter from "./routes/user.routes.js";

dotenv.config();
const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("backend is working!");
});

app.use("/users", usersRouter);
app.use("/posts", postsRouter);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`running!! on port ${PORT}`);
});
