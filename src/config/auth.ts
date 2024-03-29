export default {
  jwt: {
    secret:
      process.env.NODE_ENV === "test"
        ? "testSecret"
        : (process.env.JWT_SECRET as string),
    expiresIn: "1d",
  },
};
