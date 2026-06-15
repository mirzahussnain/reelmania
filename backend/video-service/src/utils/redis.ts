import { createClient, RedisClientType } from "redis";
import dotenv from "dotenv";
dotenv.config();

let redisClient: RedisClientType | null = null;

export const connectRedis = async () => {
    if (redisClient) return redisClient;

    const url = process.env.REDIS_URL || "redis://localhost:6379";
    redisClient = createClient({
        url,
    });

    redisClient.on("error", (error) => {
        console.error("Redis Client Error", error);
    });

    redisClient.on("connect", () => {
        console.log("Connected to Redis successfully");
    });

    try {
        await redisClient.connect();
    } catch (error) {
        console.error("Failed to connect to Redis", error);
    }

    return redisClient;
};

export const getRedisClient = () => {
    if (!redisClient) {
        throw new Error("Redis client not initialized. Call connectRedis first.");
    }
    return redisClient;
};
