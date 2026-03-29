let isConnected = false;
let upstashConfig = null;

const getUpstashConfig = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return { url, token };
};

const upstashRequest = async (commandParts) => {
  if (!upstashConfig) {
    return null;
  }

  const encodedCommand = commandParts.map((part) => encodeURIComponent(part));
  const endpoint = `${upstashConfig.url}/${encodedCommand.join("/")}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${upstashConfig.token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Upstash request failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(payload.error);
  }

  return payload.result;
};

const initRedis = async () => {
  if (isConnected) {
    return true;
  }

  try {
    upstashConfig = getUpstashConfig();
    if (upstashConfig) {
      isConnected = true;
      console.log("Upstash REST Redis configured successfully");
      return true;
    }

    console.warn(
      "UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing. Caching disabled.",
    );
    return null;
  } catch (error) {
    console.error("Redis connection error:", error);
    isConnected = false;
    upstashConfig = null;
    return null;
  }
};

const setCache = async (key, value, ttl = 3600) => {
  try {
    if (!isConnected) {
      return null;
    }

    await upstashRequest(["SETEX", key, String(ttl), JSON.stringify(value)]);
    return true;
  } catch (error) {
    console.error("Error setting cache:", error);
    return null;
  }
};

const getCache = async (key) => {
  try {
    if (!isConnected) {
      return null;
    }

    const data = await upstashRequest(["GET", key]);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error getting cache:", error);
    return null;
  }
};

const deleteCache = async (key) => {
  try {
    if (!isConnected) {
      return null;
    }

    await upstashRequest(["DEL", key]);
    return true;
  } catch (error) {
    console.error("Error deleting cache:", error);
    return null;
  }
};

const invalidateFeedCache = async (tag = null) => {
  try {
    if (!isConnected) {
      return null;
    }

    const keys = (await upstashRequest(["KEYS", "feed:*"])) || [];

    if (!Array.isArray(keys) || keys.length === 0) {
      return true;
    }

    if (tag) {
      const tagSpecificKeys = keys.filter((key) => {
        const parts = key.split(":");
        return parts.length > 2 && parts[2] === tag;
      });

      if (tagSpecificKeys.length > 0) {
        await upstashRequest(["DEL", ...tagSpecificKeys]);
      }
    } else {
      await upstashRequest(["DEL", ...keys]);
    }
    return true;
  } catch (error) {
    console.error("Error invalidating feed cache:", error);
    return null;
  }
};

export { deleteCache, getCache, initRedis, invalidateFeedCache, setCache };
