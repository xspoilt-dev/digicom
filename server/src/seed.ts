import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Product from "./models/Product";
import Setting from "./models/Setting";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/kalobazar";

const sampleProducts = [
  {
    title: "ChatGPT Plus (Private Account)",
    slug: "chatgpt-plus-private-account",
    description: "ChatGPT Plus ব্যক্তিগত অ্যাকাউন্ট। GPT-4o, o1-preview, DALL-E 3, Advanced Voice Mode এবং কাস্টম GPTs এক্সেস। পেমেন্ট সম্পন্ন হওয়া মাত্র ইনস্ট্যান্ট ইমেইল ও পাসওয়ার্ড প্রদান করা হয়।",
    price: 2450,
    compareAtPrice: 2800,
    type: "account",
    serviceTag: "chatgpt",
    category: "ai",
    duration: "১ মাস",
    autoFulfill: true,
    upstreamProductId: "64f0c0f2b90c2b4c5a123456",
    availability: { available: 45, sold: 120 },
    promotions: [{ type: "bulk_discount", minQty: 3, percent: 10, bonusQty: 1 }],
    checkoutFields: ["name", "email", "phone"],
    isEmailDelivery: true,
    isWebDisplay: true,
    active: true,
  },
  {
    title: "ChatGPT Business Slot (Own Email)",
    slug: "chatgpt-business-slot",
    description: "আপনার নিজস্ব ইমেইলে ChatGPT Business / Team ওয়ার্কস্পেস স্লট ইনভাইটেশন। আপনার কোনো ডেটা ট্রেইন করা হবে না এবং দ্বিগুণ মেসেজ লিমিট পাবেন।",
    price: 1200,
    compareAtPrice: 1500,
    type: "slot",
    serviceTag: "chatgpt",
    category: "ai",
    duration: "১ - ১২ মাস",
    autoFulfill: true,
    upstreamProductId: "slot_chatgpt_business",
    purchaseRequirements: {
      customerEmail: true,
      slotMonths: true,
      quantityFixed: 1,
      allowedMonths: [1, 3, 6, 12],
    },
    availability: { available: 85, sold: 210 },
    checkoutFields: ["name", "email", "phone"],
    isEmailDelivery: true,
    isWebDisplay: true,
    active: true,
  },
  {
    title: "Claude 3.5 Sonnet Pro Account",
    slug: "claude-3-5-pro-account",
    description: "Anthropic Claude Pro প্রাইভেট অ্যাকাউন্ট। আনলিমিটেড কোডিং, আর্টিফ্যাক্টস এবং দীর্ঘ কনটেক্সট উইন্ডো। ফুল ওয়ারেন্টি সহ ইনস্ট্যান্ট ডেলিভারি।",
    price: 2350,
    compareAtPrice: 2700,
    type: "account",
    serviceTag: "claude",
    category: "ai",
    duration: "১ মাস",
    autoFulfill: true,
    availability: { available: 30, sold: 95 },
    checkoutFields: ["name", "email", "phone"],
    isEmailDelivery: true,
    isWebDisplay: true,
    active: true,
  },
  {
    title: "Cursor Pro (AI Code Editor)",
    slug: "cursor-pro-account",
    description: "ডেভেলপারদের জন্য সেরা AI Code Editor। আনলিমিটেড Claude 3.5 Sonnet ও GPT-4o Fast Requests, Composer এবং মাল্টি-ফাইল এডিটিং সুবিধা।",
    price: 2200,
    compareAtPrice: 2500,
    type: "account",
    serviceTag: "cursor",
    category: "dev",
    duration: "১ মাস",
    autoFulfill: true,
    availability: { available: 22, sold: 68 },
    checkoutFields: ["name", "email", "phone"],
    isEmailDelivery: true,
    isWebDisplay: true,
    active: true,
  },
  {
    title: "Canva Pro (Team Workspace Slot)",
    slug: "canva-pro-team-slot",
    description: "আপনার ব্যক্তিগত ইমেইলে Canva Pro টিম ইনভাইটেশন। ম্যাজিক স্টুডিও AI, প্রিমিয়াম টেমপ্লেট, ব্যাকগ্রাউন্ড রিমুভার এবং ১TB ক্লাউড স্টোরেজ।",
    price: 250,
    compareAtPrice: 499,
    type: "slot",
    serviceTag: "canva",
    category: "creative",
    duration: "১ বছর / লাইফটাইম",
    autoFulfill: true,
    purchaseRequirements: {
      customerEmail: true,
      quantityFixed: 1,
    },
    availability: { available: 150, sold: 640 },
    checkoutFields: ["name", "email", "phone"],
    isEmailDelivery: true,
    isWebDisplay: true,
    active: true,
  },
  {
    title: "Adobe Creative Cloud All Apps",
    slug: "adobe-creative-cloud-all-apps",
    description: "Photoshop, Illustrator, Premiere Pro, After Effects সহ অ্যাডোবির সকল অ্যাপস আপনার নিজস্ব অ্যাডোবি একাউন্টে অ্যাক্টিভেশন। জেনারেটিভ AI ফায়ারফ্লাই সাপোর্টেড।",
    price: 1850,
    compareAtPrice: 2500,
    type: "slot",
    serviceTag: "adobe",
    category: "creative",
    duration: "১ বছর",
    autoFulfill: true,
    purchaseRequirements: {
      customerEmail: true,
      quantityFixed: 1,
    },
    availability: { available: 20, sold: 88 },
    checkoutFields: ["name", "email", "phone"],
    isEmailDelivery: true,
    isWebDisplay: true,
    active: true,
  },
  {
    title: "NordVPN Premium (Dedicated Account)",
    slug: "nordvpn-premium-account",
    description: "৬টি ডিভাইসে একসাথে ব্যবহারযোগ্য NordVPN প্রিমিয়াম একাউন্ট। হাই-স্পিড সার্ভার, থ্রেট প্রোটেকশন এবং ফুল এনক্রিপশন সাপোর্ট।",
    price: 950,
    compareAtPrice: 1600,
    type: "account",
    serviceTag: "nordvpn",
    category: "vpn",
    duration: "২ বছর",
    autoFulfill: true,
    availability: { available: 55, sold: 140 },
    checkoutFields: ["name", "email", "phone"],
    isEmailDelivery: true,
    isWebDisplay: true,
    active: true,
  },
  {
    title: "Spotify Premium (Family Slot)",
    slug: "spotify-premium-family-slot",
    description: "আপনার নিজস্ব স্পটিফাই একাউন্টে ১ বছরের প্রিমিয়াম সাবস্ক্রিপশন। সম্পূর্ণ বিজ্ঞাপনমুক্ত গান শোনা ও অফলাইন ডাউনলোড সুবিধা।",
    price: 499,
    compareAtPrice: 850,
    type: "slot",
    serviceTag: "spotify",
    category: "streaming",
    duration: "১ বছর",
    autoFulfill: true,
    purchaseRequirements: {
      customerEmail: true,
      quantityFixed: 1,
    },
    availability: { available: 80, sold: 310 },
    checkoutFields: ["name", "email", "phone"],
    isEmailDelivery: true,
    isWebDisplay: true,
    active: true,
  },
  {
    title: "Netflix Premium 4K UHD (Private Profile)",
    slug: "netflix-premium-4k-uhd",
    description: "ব্যক্তিগত পিন প্রটেক্টেড Netflix 4K আল্ট্রা এইচডি প্রোফাইল। কোনো স্ক্রিন লিমিটেশন বা ইন্টারাপশন ছাড়া স্মুথ স্ট্রিমিং ও ফুল ওয়ারেন্টি।",
    price: 350,
    compareAtPrice: 450,
    type: "account",
    serviceTag: "netflix",
    category: "streaming",
    duration: "১ মাস",
    autoFulfill: true,
    availability: { available: 40, sold: 290 },
    checkoutFields: ["name", "email", "phone"],
    isEmailDelivery: true,
    isWebDisplay: true,
    active: true,
  },
  {
    title: "CapCut Pro VIP (1 Year Access)",
    slug: "capcut-pro-vip",
    description: "ভিডিও এডিটরদের সেরা পছন্দ CapCut Pro VIP একাউন্ট। সকল প্রিমিয়াম AI ট্রানজিশন, অটো-ক্যাপশন, ব্যাকগ্রাউন্ড রিমুভার এবং 4K এক্সপোর্ট।",
    price: 850,
    compareAtPrice: 1200,
    type: "account",
    serviceTag: "capcut",
    category: "creative",
    duration: "১ বছর",
    autoFulfill: true,
    availability: { available: 65, sold: 175 },
    checkoutFields: ["name", "email", "phone"],
    isEmailDelivery: true,
    isWebDisplay: true,
    active: true,
  },
  {
    title: "YouTube Premium (1 Year Family Slot)",
    slug: "youtube-premium-family-slot",
    description: "আপনার ব্যক্তিগত জিমেইল একাউন্টে ১ বছরের জন্য YouTube Premium এবং YouTube Music অ্যাক্টিভেশন। ব্যাকগ্রাউন্ড প্লে ও পিকচার-ইন-পিকচার সুবিধা।",
    price: 650,
    compareAtPrice: 950,
    type: "slot",
    serviceTag: "youtube",
    category: "streaming",
    duration: "১ বছর",
    autoFulfill: true,
    purchaseRequirements: {
      customerEmail: true,
      quantityFixed: 1,
    },
    availability: { available: 90, sold: 420 },
    checkoutFields: ["name", "email", "phone"],
    isEmailDelivery: true,
    isWebDisplay: true,
    active: true,
  },
  {
    title: "Suno AI / ElevenLabs Creator Access",
    slug: "suno-ai-elevenlabs-creator",
    description: "হাই-কোয়ালিটি AI মিউজিক কম্পোজিশন ও আল্ট্রা-রিয়েলিস্টিক ভয়েস ক্লোনিং এর জন্য Suno AI ও ElevenLabs প্রিমিয়াম ক্রেডিট প্যাকেজ।",
    price: 1550,
    compareAtPrice: 1900,
    type: "account",
    serviceTag: "suno",
    category: "creative",
    duration: "১ মাস",
    autoFulfill: true,
    availability: { available: 25, sold: 55 },
    checkoutFields: ["name", "email", "phone"],
    isEmailDelivery: true,
    isWebDisplay: true,
    active: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for seeding...");

    for (const p of sampleProducts) {
      await Product.findOneAndUpdate({ slug: p.slug }, p, { upsert: true, new: true });
    }
    console.log(`Successfully seeded ${sampleProducts.length} digital subscription products!`);

    // Ensure company info setting exists
    await Setting.findOneAndUpdate(
      { key: "company_info" },
      {
        key: "company_info",
        value: {
          name: "KaloBazar Digital",
          tagline: "অটোমেটেড ডিজিটাল সাবস্ক্রিপশন ও অ্যাকাউন্ট মার্কেটপ্লেস",
          supportEmail: "support@kalobazar.com",
          supportTelegram: "https://t.me/kalobazar_support",
          supportPhone: "+8801700000000",
        },
      },
      { upsert: true }
    );
    console.log("Seeded company settings.");

    process.exit(0);
  } catch (err: any) {
    console.error("Seeding error:", err.message);
    process.exit(1);
  }
}

seed();
