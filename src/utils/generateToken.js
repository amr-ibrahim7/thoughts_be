import jwt from "jsonwebtoken";

const generateToken = (user) => {
  const accessToken = jwt.sign(
    { email: user.email, id: user._id },
    process.env.ACCESS_JWT_KEY,
    { expiresIn: "5d" }
  );

  return { accessToken };
};

export default generateToken;