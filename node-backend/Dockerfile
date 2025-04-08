# Use official Node.js image
FROM node:16

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies (including devDependencies)
RUN npm install --only=production --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Expose the port that your Node.js app runs on
EXPOSE 5000

# Start the application using Node.js directly (production mode)
CMD ["node", "server.js"]
