import jwt from 'jsonwebtoken';

export const signToken = (userId: string, rememberMe = false) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: rememberMe ? '30d' : '7d' }
  );
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
};
