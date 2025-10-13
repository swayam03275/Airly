# Airly

Airly is a image-based social media webapp where people can share posts, like and comment on posts, and discover popular posts through a smart ranking algorithm.

It's built as a full-stack webapp with a clean, minimal design that has a scalable backend.

## About the Developer

This project is developed by **Swayam** - a passionate full-stack developer focused on building scalable web applications with modern technologies.

- **GitHub**: [https://github.com/swayam03275](https://github.com/swayam03275)
- **Repository**: [https://github.com/swayam03275/Airly](https://github.com/swayam03275/Airly)

# Why I Built This!

I built this full-stack webapp project with a strong focus on writing a good backend and for learning backend in Node.js.

This kind of project enabled me to explore aggregation pipelines and other intermediate stuff in backend development!

# Tech Stack - (Why each technology/approach was chosen)

**Backend** -> I chose JavaScript (Node.js) for the whole backend of this project because I am very fluent with it and it's very developer friendly!

For the technical part, I chose MongoDB as the database because it is developer friendly and easy to use. You can use either a local MongoDB installation or MongoDB Atlas for cloud hosting.

I wanted to use and focus on a denormalized approach for data keeping (models) for fast performance and not so much on perfect data structuring.

It doesn't require structuring like SQL DBs - just documents! No need for customizing anything (until you want to) and that is where it wins!

For the image storing part, I integrated Cloudinary as a part of my backend because it works pretty well and handles image optimization automatically!

For recurring tasks used in literally every file, I made a utils folder for consistent API responses, API errors and an async handler for reusability (Node.js wins here)! - This is really good practice!

I also added database indexing, which I learned while making this project. Strategic indexing for queries can speed up performance significantly.

---

**Frontend** -> I used React with TypeScript for the frontend and Vite as the build tool because I wanted to learn TypeScript and it provides better developer experience!

For styling, I picked Tailwind CSS because it lets us make modern UIs (mine was inspired by Pinterest dashboard) super quickly without writing custom CSS.

For state management, I used Redux Toolkit. I also added localStorage persistence so user sessions survive page refreshes, which is crucial for a good UX. For routing I used React Router DOM!

For UI components, I went with Lucide React for icons because they're beautiful and modern.

I organized code into clear folders (auth, layout, modals, pages) with proper error handling for performance and clean code structure.

# Learnings

Full-stack development, modern JS/TS, React ecosystem, API integration, MongoDB aggregation pipelines, JWT authentication, file handling, and state management.

**Challenges I overcame** - CORS configuration, file uploads with Multer and Cloudinary, MongoDB aggregation queries, JWT token management, and React TypeScript patterns.

## **Some cool Backend things i enjoyed**

### **1. Popular Posts Algorithm**

The popular posts feature implements a algorithm like a ranking system that goes far beyond simple "most liked" sorting. Instead of just counting likes, this algorithm creates a **engagement score** that considers the quality and type of user interaction.

How the Algorithm Works: we decide stuff on basis of these things -

- Likes (2x weight)
- Comments (1x weight)
- Views (0.5x weight)
- Recency factor - When scores are tied, newer posts get slight preference to keep content fresh.

imagine a post with 10 likes and 5 comments might rank higher than one with 20 likes but no comments. (yes this is an algorithmm)

This algorithm uses MongoDB's aggregation pipeline thingy to calculate scores(likes, comments) in real-time.

---

### **2. Text indexing advance search across multiple fields**

multi-field text indexing is something so cool that it takes out stuff out of a mess of data to a request made by a user - that provides intelligent, context-aware search results.

This goes far beyond simple keyword matching to deliver relevant and fast results across different types of content.

---

### AI Usage

I used AI tools strategically and minimally throughout this project, mainly for learning and problem-solving.

For the frontend, I occasionally used AI to help understand complex TypeScript patterns and React best practices when I got stuck. The masonry structure (the brick-like structure of the posts) for a Pinterest-like look was challenging to implement, so I brainstormed with AI to find implementation approaches.

The search functionality in the backend uses MongoDB's built-in text indexing and regex matching, but I took help when I got stuck with complex aggregation queries.

AI helped me learn faster and solve specific problems, but the logic, architecture, algorithms, and core implementation are all my own work.

---

## Local Development Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- Cloudinary account (for image uploads)

### 1. Clone the Repository

```bash
git clone https://github.com/swayam03275/Airly.git
cd Airly
```

### 2. Backend Setup

```bash
cd Backend
npm install

# Create environment variables file
cp .env.example .env
# Edit .env file with your actual values (MongoDB URI, JWT secrets, Cloudinary credentials)

# Start the backend server
npm run dev
```

The backend server will start on `http://localhost:8000`

### 3. Frontend Setup

Open a new terminal window/tab:

```bash
cd frontend
npm install

# Create environment variables file
cp .env.example .env
# Edit .env file to set VITE_SERVER_API=http://localhost:8000/api/v1

# Start the frontend server
npm run dev
```

The frontend will start on `http://localhost:5173`

### 4. Environment Configuration

#### Backend (.env)

- `MONGODB_URI`: Your MongoDB connection string
- `ACCESS_TOKEN_SECRET` & `REFRESH_TOKEN_SECRET`: Generate strong random strings
- `CLOUDINARY_*`: Get these from your Cloudinary dashboard

#### Frontend (.env)

- `VITE_SERVER_API`: Should point to your backend URL (http://localhost:8000/api/v1)

### 5. Testing

- **Backend API**: Use [Postman](https://www.postman.com/) or similar tools to test API endpoints
- **Frontend**: Use your browser to test the UI and user flows
- **Full Stack**: Ensure both servers are running to test the complete application

### 6. Database Setup

If using local MongoDB:

```bash
# Make sure MongoDB is installed and running
mongod
```

If using MongoDB Atlas:

1. Create a cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Get your connection string and add it to the backend .env file

---

## Project Structure

- `/Backend` - Node.js/Express API server
- `/frontend` - React/TypeScript client application
- Both folders have their own package.json and dependencies

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
