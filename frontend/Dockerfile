# Use Node.js as the base image for development
FROM node:16 AS development

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json (or yarn.lock) and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps  # Handle dependency conflicts

# Copy the rest of the application code
COPY . .

# Expose the port the app will run on (default React port)
EXPOSE 3000

# Start the React app in development mode with hot-reloading
CMD ["npm", "start"]
