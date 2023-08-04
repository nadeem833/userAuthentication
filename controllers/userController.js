const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { use } = require("../routes/userRoutes");

//@desc Register a user
//@route POST /api/users/register
//@access public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    res.status(400);
    throw new Error("All fields are mandatory!");
  }
  const userAvailable = await User.findOne({ email });
  if (userAvailable) {
    res.status(400);
    throw new Error("User already registered!");
  }

  //Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("Hashed Password: ", hashedPassword);
  const user = await User.create({
    username,
    email,
    password: hashedPassword,
  });

  console.log(`User created ${user}`);
  if (user) {
    res.status(201).json({ _id: user.id, email: user.email });
  } else {
    res.status(400);
    throw new Error("User data us not valid");
  }
  res.json({ message: "Register the user" });
});

//@desc Login user
//@route POST /api/users/login
//@access public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("All fields are mandatory!");
  }
  const user = await User.findOne({ email });
  //compare password with hashedpassword
  if (user && (await bcrypt.compare(password, user.password))) {
    const accessToken = jwt.sign(
      {
        user: {
          username: user.username,
          email: user.email,
          id: user.id,
        },
      },
      process.env.ACCESS_TOKEN_SECERT,
      { expiresIn: "30d" }
    );
    res.status(200).json({ accessToken });
  } else {
    res.status(401);
    throw new Error("email or password is not valid");
  }
});

//@desc Current user info
//@route POST /api/users/current
//@access private
const currentUser = asyncHandler(async (req, res) => {
  res.json(req.user);
});

const changeUserPassword = async (req, res) => {
  const { password, password_confirmation } = req.body;
  if (password && password_confirmation) {
    if (password !== password_confirmation) {
      res.send({ status: "failed", message: "New Password and Confirm New Password doesn't match" });
    } else {
      const salt = await bcrypt.genSalt(10);
      const newHashPassword = await bcrypt.hash(password, salt);
      await User.findByIdAndUpdate(req.query.id, { $set: { password: newHashPassword } });
      res.send({ status: "success", message: "Password changed succesfully" });
    }
  } else {
    res.send({ status: "failed", message: "All Fields are Required" });
  }
};

const sendUserPasswordResetEmail = async (req, res) => {
  const { email } = req.body;
  if (email) {
    const user = await User.findOne({ email: email });
    if (user) {
      const secret = process.env.ACCESS_TOKEN_SECERT;
      const token = jwt.sign({ userID: user._id }, secret, { expiresIn: "1d" });
      const link = `http://127.0.0.1:5001/api/users/reset-password/${user._id}/${token}`;
      console.log(link);
      // // Send Email
      // let info = await transporter.sendMail({
      //   from: process.env.EMAIL_FROM,
      //   to: user.email,
      //   subject: "GeekShop - Password Reset Link",
      //   html: `<a href=${link}>Click Here</a> to Reset Your Password`
      // })
      res.send({ status: "success", message: "Password Reset Email Sent... Please Check Your Email" });
    } else {
      res.send({ status: "failed", message: "Email doesn't exists" });
    }
  } else {
    res.send({ status: "failed", message: "Email Field is Required" });
  }
};

const userPasswordReset = async (req, res) => {
  const { password, password_confirmation } = req.body;
  const { id, token } = req.params;
  console.log("id and token", id, token);
  const user = await User.findById(id);
  const new_secret = process.env.ACCESS_TOKEN_SECERT;
  console.log("this is user", new_secret);
  try {
    jwt.verify(token, new_secret);
    if (password && password_confirmation) {
      if (password !== password_confirmation) {
        res.send({ status: "failed", message: "New Password and Confirm New Password doesn't match" });
      } else {
        const salt = await bcrypt.genSalt(10);
        const newHashPassword = await bcrypt.hash(password, salt);
        await User.findByIdAndUpdate(user._id, { $set: { password: newHashPassword } });
        res.send({ status: "success", message: "Password Reset Successfully" });
      }
    } else {
      res.send({ status: "failed", message: "All Fields are Required" });
    }
  } catch (error) {
    console.log(error);
    res.send({ status: "failed", message: "Invalid Token" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  currentUser,
  changeUserPassword,
  userPasswordReset,
  sendUserPasswordResetEmail,
};
