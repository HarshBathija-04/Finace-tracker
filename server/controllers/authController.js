import bcrypt from "bcryptjs";
import userModel from "../models/User.js";
import generateToken from "../utils/generateToken.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, currency } = req.body;

    const existingUser = await userModel.findOne({ email });
    if(existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({ name, email, password: hashedPassword, currency });
    res.status(201).json({
      message: "Registration sucessfull",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if(!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) {
      return res.status(400).json({ message: "Incorrect Password" });
    }

    res.status(200).json({
      message: "Login Successfull",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
