import bcrypt from "bcrypt";
import postModel from "../models/post.model.js";
import userModel from "../models/user.model.js";
import generateToken from "../utils/generateToken.js";

export const registerUser = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || name.trim() === "" || !email || !password) {
      return res.status(400).json({
        status: "error",
        message:
          "Feilds are required and cannot be empty or contain only spaces.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid email format.",
      });
    }

    if (password.trim().length < 6) {
      return res.status(400).json({
        status: "error",
        message:
          "Password must be at least 6 characters long (excluding spaces).",
      });
    }

    let existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        status: "error",
        message: "User already exists!",
      });
    }

    bcrypt.genSalt(10, async (err, salt) => {
      if (err) {
        return res.status(500).send("Error while generating salt!");
      }

      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) {
          return res.status(500).send("Error while hashing the password!");
        }

        let newUser = await userModel.create({
          name,
          email,
          password: hash,
        });

        const { accessToken } = generateToken(newUser);

        return res.status(201).json({
          status: "success",
          message: "User registered successfully!",
          accessToken: `${accessToken}`,
          data: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            createdAt: newUser.createdAt,
            profilePicture: newUser.profilePicture,
          },
        });
      });
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Internal server error!",
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Please provide all the required fields!",
      });
    }

    let user = await userModel.findOne({ email });

    if (!user)
      return res.status(401).json({
        status: "error",
        message: "User does not exist!",
      });

    bcrypt.compare(password, user.password, function (err, result) {
      if (err) return res.status(500).send("Error while comparing password!");
      if (!result)
        return res.status(401).json({
          status: "error",
          message: "Invalid password!",
        });

      if (result) {
        const { accessToken } = generateToken(user);

        res.status(200).json({
          status: "success",
          message: "User logged in successfully!",
          accessToken: `${accessToken}`,
          data: {
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            profilePicture: user.profilePicture,
          },
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Internal server error!",
    });
  }
};



export const updateUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found!",
      });
    }

    const { name, email, oldPassword, newPassword } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;

    if (newPassword) {
      if (!oldPassword) {
        return res.status(400).json({
          status: "error",
          message: "Old password is required to update the password.",
        });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          status: "error",
          message: "Old password is incorrect.",
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    res.status(200).json({
      status: "success",
      message: "User updated successfully!",
      data: { name: user.name, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Internal server error!",
    });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found!",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Internal server error!",
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found!",
      });
    }

    await postModel.deleteMany({ author: req.user._id });

    await user.deleteOne();
    res.status(200).json({
      status: "success",
      message: "User deleted successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Internal server error!",
    });
  }
};

export const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No file uploaded!",
      });
    }

    const buffer = req.file.buffer;
    const base64Image = buffer.toString("base64");
    const profilePicture = `data:${req.file.mimetype};base64,${base64Image}`;

    const user = await userModel.findByIdAndUpdate(
      userId,
      { profilePicture },
      { new: true }
    );

    res.status(200).json({
      status: "success",
      message: "Profile picture uploaded successfully!",
      data: { profilePicture: user.profilePicture },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Error uploading profile picture",
    });
  }
};
