import { prisma } from "@/lib/db";
import { makeUniqueSlug } from "@/lib/utils";

const initialCategories = [
  { name: "Aerospace & Defense", description: "Advanced aerospace and defense technologies" },
  {
    name: "Agriculture & Farming",
    description: "Agricultural technologies and farming innovations",
  },
  {
    name: "Artificial Intelligence",
    description: "AI-powered solutions and machine learning technologies",
  },
  {
    name: "Arts & Crafts",
    description: "Creative products, artistic supplies, and handmade goods",
  },
  {
    name: "Automotive",
    description: "Automotive products, services, and transportation innovations",
  },
  {
    name: "Beauty & Personal Care",
    description: "Cosmetics, skincare, and personal grooming products",
  },
  { name: "Biotechnology", description: "Advanced biological and medical research technologies" },
  { name: "Blockchain & Crypto", description: "Cryptocurrency and blockchain-based technologies" },
  { name: "Chatbots", description: "AI-powered chatbots and conversational interfaces" },
  {
    name: "Circular Economy",
    description: "Sustainable business models and regenerative solutions",
  },
  {
    name: "Climate Tech",
    description: "Innovative technologies addressing climate change and environmental challenges",
  },
  {
    name: "Consulting & Professional Services",
    description: "Expert advisory and professional consultation",
  },
  { name: "Cybersecurity", description: "Digital security and data protection technologies" },
  {
    name: "Digital Art & NFTs",
    description: "Digital creative works and blockchain-based art platforms",
  },
  { name: "Digital Marketing", description: "Online marketing strategies and promotional tools" },
  { name: "E-commerce", description: "Online retail and digital marketplace solutions" },
  {
    name: "Education & Online Courses",
    description: "Learning platforms and educational resources",
  },
  { name: "Event Planning", description: "Event management and coordination services" },
  {
    name: "Extended Reality (XR)",
    description: "Virtual, augmented, and mixed reality technologies",
  },
  { name: "Fashion & Apparel", description: "Clothing, accessories, and style-related products" },
  { name: "Finance", description: "Financial services, investment, and money management tools" },
  {
    name: "Fitness & Sports",
    description: "Athletic gear, fitness equipment, and sports-related products",
  },
  {
    name: "Freelance Services",
    description: "Independent professional services and skill-based offerings",
  },
  {
    name: "Food & Beverage",
    description: "Culinary products, restaurants, and food-related innovations",
  },
  {
    name: "Gaming & Entertainment",
    description: "Video games, entertainment platforms, and media",
  },
  {
    name: "Genetic Engineering",
    description: "Advanced genetic research and biotechnology innovations",
  },
  {
    name: "Health & Wellness",
    description: "Products and services promoting physical and mental well-being",
  },
  {
    name: "Home & Lifestyle",
    description: "Home improvement, decor, and lifestyle enhancement products",
  },
  {
    name: "Influencer Marketing",
    description: "Digital marketing strategies leveraging social media personalities",
  },
  { name: "Insurance", description: "Insurance products and risk management services" },
  {
    name: "Internet of Things (IoT)",
    description: "Connected devices and smart technology ecosystems",
  },
  { name: "Legal Services", description: "Legal consultation and professional legal solutions" },
  {
    name: "Logistics & Shipping",
    description: "Transportation, delivery, and supply chain solutions",
  },
  { name: "Manufacturing", description: "Industrial production and manufacturing technologies" },
  {
    name: "Marine & Ocean Technologies",
    description: "Marine research and ocean-related innovations",
  },
  { name: "Media & Publishing", description: "Content creation, media platforms, and publishing" },
  {
    name: "Mental Health Services",
    description: "Digital platforms and services supporting psychological well-being",
  },
  { name: "Nanotechnology", description: "Cutting-edge molecular and atomic-scale engineering" },
  {
    name: "Nonprofit & Social Impact",
    description: "Charitable organizations and social change initiatives",
  },
  {
    name: "Podcast & Audio Platforms",
    description: "Digital audio content creation and distribution services",
  },
  {
    name: "Quantum Computing",
    description: "Advanced computational technologies using quantum mechanics",
  },
  {
    name: "Real Estate",
    description: "Property services, real estate solutions, and property tech",
  },
  { name: "Recruitment & HR", description: "Human resources and talent acquisition solutions" },
  { name: "Renewable Energy", description: "Sustainable energy solutions and green technology" },
  { name: "Robotics", description: "Robotic technologies and automated solutions" },
  {
    name: "Smart Cities",
    description: "Urban technologies and innovative city infrastructure solutions",
  },
  {
    name: "Software & SaaS",
    description: "Cloud-based software and subscription service platforms",
  },
  {
    name: "Space Technologies",
    description: "Innovations in space exploration and satellite technologies",
  },
  {
    name: "Sustainable Products",
    description: "Eco-friendly and environmentally conscious products",
  },
  { name: "Telemedicine", description: "Remote medical consultation and digital health services" },
  { name: "Telecommunications", description: "Communication technologies and network services" },
  {
    name: "Travel & Hospitality",
    description: "Tourism, travel services, and hospitality solutions",
  },
  {
    name: "Hosting & Cloud",
    description: "Web hosting services and cloud infrastructure solutions",
  },
  {
    name: "Advertising Agencies",
    description: "Advertising agencies and marketing consulting services",
  },
  {
    name: "Celebrities",
    description: "Celebrity endorsements and influencer marketing",
  },
  {
    name: "KOL/KOC",
    description: "Key opinion leaders and content creators",
  },
  {
    name: "Influencer Marketing",
    description: "Digital marketing strategies leveraging social media personalities",
  },
  {
    name: "Entrepreneurs",
    description: "Entrepreneurial ventures and startup initiatives",
  },
  {
    name: "Solopreneurs/Solo Founders",
    description: "Independent professionals and self-employed individuals",
  },
];

export async function createInitialCategories() {
  // Check if any categories already exist
  for (const category of initialCategories) {
    const existingCategory = await prisma.category.count({
      where: { name: category.name },
    });

    if (!existingCategory) {
      await prisma.category.create({
        data: {
          ...category,
          status: "active",
          slug: await makeUniqueSlug(prisma.category, category.name),
        },
      });
    }
  }
}

export async function getCategories() {
  return await prisma.category.findMany({
    where: { status: "active" },
  });
}
