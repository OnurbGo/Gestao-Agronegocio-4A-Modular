import express from "express";
import cors from "cors";

const App = express();
app.use(cors());
app.use(express.json());

export default App;
