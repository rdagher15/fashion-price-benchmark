import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateMatchesForListing } from "../src/lib/matching";
import { generateOrderNumber } from "../src/lib/format";
import { DEFAULT_ORDER_CHECKLIST, LISTING_STATUS, REQUIREMENT_STATUS, OFFER_STATUS, ORDER_STATUS } from "../src/lib/constants";

const prisma = new PrismaClient();

function addDays(d: Date, days: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

async function main() {
  console.log("Clearing existing data...");
  await prisma.review.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.orderChecklistItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.negotiation.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.match.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.farmerProduce.deleteMany();
  await prisma.farmPhoto.deleteMany();
  await prisma.buyerDeliveryLocation.deleteMany();
  await prisma.farmerProfile.deleteMany();
  await prisma.buyerProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.produceCategory.deleteMany();
  await prisma.matchingConfig.deleteMany();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const passwordHash = await bcrypt.hash("demo1234", 10);

  console.log("Seeding matching config...");
  await prisma.matchingConfig.create({ data: { id: "singleton" } });

  console.log("Seeding produce taxonomy...");
  const catDefs: { family: string; name: string }[] = [
    { family: "Vegetables", name: "Tomatoes" },
    { family: "Vegetables", name: "Cucumbers" },
    { family: "Vegetables", name: "Peppers" },
    { family: "Vegetables", name: "Eggplant" },
    { family: "Vegetables", name: "Zucchini" },
    { family: "Root Vegetables", name: "Potatoes" },
    { family: "Root Vegetables", name: "Onions" },
    { family: "Root Vegetables", name: "Carrots" },
    { family: "Root Vegetables", name: "Beetroot" },
    { family: "Root Vegetables", name: "Radish" },
    { family: "Leafy Greens", name: "Lettuce" },
    { family: "Leafy Greens", name: "Spinach" },
    { family: "Leafy Greens", name: "Arugula" },
    { family: "Fruits", name: "Apples" },
    { family: "Fruits", name: "Oranges" },
    { family: "Fruits", name: "Bananas" },
    { family: "Fruits", name: "Strawberries" },
    { family: "Herbs", name: "Mint" },
    { family: "Herbs", name: "Parsley" },
  ];
  const cat: Record<string, string> = {};
  for (const c of catDefs) {
    const created = await prisma.produceCategory.create({ data: { family: c.family, name: c.name, defaultUnit: "kg" } });
    cat[c.name] = created.id;
  }

  console.log("Seeding admin...");
  await prisma.user.create({
    data: {
      role: "ADMIN", status: "ACTIVE", firstName: "Admin", lastName: "User",
      email: "admin@harvestlink.demo", phone: "+966500000000", passwordHash,
    },
  });

  console.log("Seeding farmers...");
  type FarmerDef = {
    email: string; firstName: string; lastName: string; farmName: string; region: string; city: string;
    lat: number; lng: number; hasOwnVehicle: boolean; refrigerated: boolean; deliveryRadiusKm?: number;
    completionPct: number; organic: boolean;
  };
  const farmerDefs: FarmerDef[] = [
    { email: "farmer1@harvestlink.demo", firstName: "Yousef", lastName: "Al-Otaibi", farmName: "Farm Al Noor", region: "Riyadh Region", city: "Riyadh", lat: 24.7136, lng: 46.6753, hasOwnVehicle: true, refrigerated: true, deliveryRadiusKm: 150, completionPct: 90, organic: false },
    { email: "farmer2@harvestlink.demo", firstName: "Huda", lastName: "Al-Qahtani", farmName: "Green Valley Farms", region: "Riyadh Region", city: "Al Kharj", lat: 24.1500, lng: 47.3000, hasOwnVehicle: false, refrigerated: false, completionPct: 65, organic: false },
    { email: "farmer3@harvestlink.demo", firstName: "Faisal", lastName: "Al-Ghamdi", farmName: "Sunrise Orchards", region: "Makkah Region", city: "Taif", lat: 21.2703, lng: 40.4158, hasOwnVehicle: true, refrigerated: true, deliveryRadiusKm: 100, completionPct: 70, organic: false },
    { email: "farmer4@harvestlink.demo", firstName: "Mishaal", lastName: "Al-Dossari", farmName: "Desert Bloom Farm", region: "Qassim Region", city: "Buraidah", lat: 26.3260, lng: 43.9750, hasOwnVehicle: false, refrigerated: false, completionPct: 55, organic: false },
    { email: "farmer5@harvestlink.demo", firstName: "Lama", lastName: "Al-Harbi", farmName: "Coastal Greens", region: "Eastern Province", city: "Al Ahsa", lat: 25.3833, lng: 49.5867, hasOwnVehicle: true, refrigerated: true, deliveryRadiusKm: 200, completionPct: 80, organic: true },
  ];

  const farmers: Record<string, { userId: string; profileId: string }> = {};
  for (const f of farmerDefs) {
    const user = await prisma.user.create({
      data: {
        role: "FARMER", status: "ACTIVE", firstName: f.firstName, lastName: f.lastName,
        email: f.email, phone: "+9665" + Math.floor(10000000 + Math.random() * 89999999), passwordHash,
        nationality: "Saudi Arabia",
        farmerProfile: {
          create: {
            farmName: f.farmName, region: f.region, city: f.city, latitude: f.lat, longitude: f.lng,
            farmSizeValue: 20 + Math.random() * 80, farmSizeUnit: "hectares", farmType: "family",
            yearsOperating: 5 + Math.floor(Math.random() * 20), numWorkers: 3 + Math.floor(Math.random() * 15),
            hasOwnVehicle: f.hasOwnVehicle, vehicleType: f.hasOwnVehicle ? "Refrigerated pickup truck" : undefined,
            vehicleCapacity: f.hasOwnVehicle ? "3 tonnes" : undefined, refrigerated: f.refrigerated,
            deliveryRadiusKm: f.deliveryRadiusKm, canDeliver: f.hasOwnVehicle, allowPickup: true,
            sharedDelivery: !f.hasOwnVehicle,
            supportTypesJson: JSON.stringify(f.completionPct > 70 ? ["Cooperative"] : []),
            organic: f.organic, conventional: !f.organic,
            usesPesticides: !f.organic, usesFertilizers: true,
            verificationStatus: f.completionPct > 60 ? "VERIFIED" : "PENDING",
            profileCompletionPct: f.completionPct,
            ratingAvg: 0, ratingCount: 0,
          },
        },
      },
      include: { farmerProfile: true },
    });
    farmers[f.farmName] = { userId: user.id, profileId: user.farmerProfile!.id };
  }

  console.log("Seeding buyers...");
  type BuyerDef = { email: string; firstName: string; lastName: string; businessName: string; buyerType: string; region: string; city: string; lat: number; lng: number };
  const buyerDefs: BuyerDef[] = [
    { email: "buyer1@harvestlink.demo", firstName: "Nora", lastName: "Al-Shammari", businessName: "Restaurant ABC", buyerType: "restaurant", region: "Riyadh Region", city: "Riyadh", lat: 24.7000, lng: 46.6800 },
    { email: "buyer2@harvestlink.demo", firstName: "Abdullah", lastName: "Al-Mutairi", businessName: "FreshMart Supermarket", buyerType: "supermarket", region: "Riyadh Region", city: "Riyadh", lat: 24.6900, lng: 46.7200 },
    { email: "buyer3@harvestlink.demo", firstName: "Sara", lastName: "Al-Zahrani", businessName: "Corner Grocery", buyerType: "grocery", region: "Riyadh Region", city: "Al Kharj", lat: 24.1600, lng: 47.3100 },
    { email: "buyer4@harvestlink.demo", firstName: "Khalid", lastName: "Al-Anazi", businessName: "King Fahd Hospital", buyerType: "hospital", region: "Riyadh Region", city: "Riyadh", lat: 24.6500, lng: 46.7100 },
    { email: "buyer5@harvestlink.demo", firstName: "Reem", lastName: "Al-Subaie", businessName: "Al Amal School", buyerType: "school", region: "Riyadh Region", city: "Riyadh", lat: 24.7300, lng: 46.6400 },
  ];

  const buyers: Record<string, { userId: string; profileId: string }> = {};
  for (const b of buyerDefs) {
    const user = await prisma.user.create({
      data: {
        role: "BUYER", status: "ACTIVE", firstName: b.firstName, lastName: b.lastName,
        email: b.email, phone: "+9665" + Math.floor(10000000 + Math.random() * 89999999), passwordHash,
        buyerProfile: {
          create: {
            businessName: b.businessName, buyerType: b.buyerType, contactPerson: `${b.firstName} ${b.lastName}`,
            region: b.region, city: b.city, latitude: b.lat, longitude: b.lng,
            verificationStatus: "VERIFIED", profileCompletionPct: 85,
            deliveryLocations: { create: [{ label: `${b.businessName} — main location`, address: `${b.city}, ${b.region}`, latitude: b.lat, longitude: b.lng, isPrimary: true }] },
          },
        },
      },
      include: { buyerProfile: true },
    });
    buyers[b.businessName] = { userId: user.id, profileId: user.buyerProfile!.id };
  }

  console.log("Seeding listings...");
  type ListingDef = {
    farm: string; produce: string; qty: number; minPrice: number; maxPrice: number; preferredPrice: number;
    fromOffset: number; untilOffset: number; delivery: string[]; organic?: boolean;
  };
  const listingDefs: ListingDef[] = [
    // Farm Al Noor — includes the canonical demo listing
    { farm: "Farm Al Noor", produce: "Tomatoes", qty: 2000, minPrice: 4.0, maxPrice: 4.5, preferredPrice: 4.25, fromOffset: 0, untilOffset: 20, delivery: ["farmer_delivery", "buyer_pickup"] },
    { farm: "Farm Al Noor", produce: "Cucumbers", qty: 500, minPrice: 3.0, maxPrice: 3.5, preferredPrice: 3.25, fromOffset: 1, untilOffset: 15, delivery: ["farmer_delivery"] },
    { farm: "Farm Al Noor", produce: "Peppers", qty: 300, minPrice: 5.0, maxPrice: 6.0, preferredPrice: 5.5, fromOffset: 2, untilOffset: 18, delivery: ["farmer_delivery", "buyer_pickup"] },
    // Green Valley Farms
    { farm: "Green Valley Farms", produce: "Lettuce", qty: 400, minPrice: 2.5, maxPrice: 3.0, preferredPrice: 2.75, fromOffset: 0, untilOffset: 12, delivery: ["buyer_pickup"] },
    { farm: "Green Valley Farms", produce: "Spinach", qty: 250, minPrice: 3.5, maxPrice: 4.0, preferredPrice: 3.75, fromOffset: 1, untilOffset: 10, delivery: ["buyer_pickup", "third_party"] },
    { farm: "Green Valley Farms", produce: "Arugula", qty: 150, minPrice: 4.5, maxPrice: 5.0, preferredPrice: 4.75, fromOffset: 0, untilOffset: 10, delivery: ["buyer_pickup"] },
    // Sunrise Orchards
    { farm: "Sunrise Orchards", produce: "Apples", qty: 1000, minPrice: 5.5, maxPrice: 6.5, preferredPrice: 6.0, fromOffset: 3, untilOffset: 25, delivery: ["farmer_delivery", "third_party"] },
    { farm: "Sunrise Orchards", produce: "Strawberries", qty: 300, minPrice: 8.0, maxPrice: 10.0, preferredPrice: 9.0, fromOffset: 2, untilOffset: 12, delivery: ["farmer_delivery"] },
    { farm: "Sunrise Orchards", produce: "Oranges", qty: 600, minPrice: 4.5, maxPrice: 5.5, preferredPrice: 5.0, fromOffset: 3, untilOffset: 20, delivery: ["third_party"] },
    // Desert Bloom Farm
    { farm: "Desert Bloom Farm", produce: "Onions", qty: 1500, minPrice: 2.0, maxPrice: 2.5, preferredPrice: 2.25, fromOffset: 1, untilOffset: 30, delivery: ["third_party", "buyer_pickup"] },
    { farm: "Desert Bloom Farm", produce: "Carrots", qty: 800, minPrice: 2.5, maxPrice: 3.0, preferredPrice: 2.75, fromOffset: 0, untilOffset: 21, delivery: ["third_party"] },
    { farm: "Desert Bloom Farm", produce: "Potatoes", qty: 2000, minPrice: 2.2, maxPrice: 2.8, preferredPrice: 2.5, fromOffset: 2, untilOffset: 30, delivery: ["third_party", "buyer_pickup"] },
    // Coastal Greens (organic)
    { farm: "Coastal Greens", produce: "Eggplant", qty: 400, minPrice: 4.0, maxPrice: 4.8, preferredPrice: 4.4, fromOffset: 0, untilOffset: 14, delivery: ["farmer_delivery"], organic: true },
    { farm: "Coastal Greens", produce: "Zucchini", qty: 350, minPrice: 3.8, maxPrice: 4.5, preferredPrice: 4.1, fromOffset: 1, untilOffset: 14, delivery: ["farmer_delivery", "buyer_pickup"], organic: true },
    { farm: "Coastal Greens", produce: "Peppers", qty: 250, minPrice: 5.5, maxPrice: 6.5, preferredPrice: 6.0, fromOffset: 2, untilOffset: 16, delivery: ["farmer_delivery"], organic: true },
  ];

  const listingIds: Record<string, string> = {};
  for (const l of listingDefs) {
    const listing = await prisma.listing.create({
      data: {
        farmerProfileId: farmers[l.farm].profileId,
        produceCategoryId: cat[l.produce],
        quantity: l.qty, unit: "kg", minOrderQuantity: Math.round(l.qty * 0.1),
        availableFrom: addDays(today, l.fromOffset), availableUntil: addDays(today, l.untilOffset),
        readyDate: addDays(today, l.fromOffset),
        grade: "A", qualityLevel: "Premium",
        productionMethod: l.organic ? "organic" : "conventional",
        packagingType: "crate", unitsPerPackage: 20, packageWeight: l.qty > 1000 ? 25 : 10,
        deliveryMethodsJson: JSON.stringify(l.delivery),
        deliveryRadiusKm: l.delivery.includes("farmer_delivery") ? 150 : undefined,
        minPrice: l.minPrice, maxPrice: l.maxPrice, preferredPrice: l.preferredPrice, priceUnit: "kg",
        status: LISTING_STATUS.PUBLISHED,
      },
    });
    listingIds[`${l.farm}:${l.produce}`] = listing.id;
  }

  console.log("Seeding requirements...");
  type RequirementDef = { buyer: string; produce: string; qty: number; dateOffset: number; minPrice?: number; maxPrice?: number; recurring?: boolean };
  const requirementDefs: RequirementDef[] = [
    // Restaurant ABC — the canonical demo requirement
    { buyer: "Restaurant ABC", produce: "Tomatoes", qty: 500, dateOffset: 2, minPrice: 4.0, maxPrice: 4.5 },
    { buyer: "Restaurant ABC", produce: "Cucumbers", qty: 200, dateOffset: 7, minPrice: 3.0, maxPrice: 3.5, recurring: true },
    { buyer: "FreshMart Supermarket", produce: "Onions", qty: 1000, dateOffset: 5, minPrice: 2.0, maxPrice: 2.6 },
    { buyer: "FreshMart Supermarket", produce: "Potatoes", qty: 1500, dateOffset: 6, minPrice: 2.2, maxPrice: 2.9 },
    { buyer: "Corner Grocery", produce: "Lettuce", qty: 150, dateOffset: 3, minPrice: 2.5, maxPrice: 3.0 },
    { buyer: "Corner Grocery", produce: "Spinach", qty: 100, dateOffset: 4, minPrice: 3.5, maxPrice: 4.0 },
    { buyer: "King Fahd Hospital", produce: "Carrots", qty: 300, dateOffset: 1, minPrice: 2.5, maxPrice: 3.2 },
    { buyer: "King Fahd Hospital", produce: "Apples", qty: 400, dateOffset: 5, minPrice: 5.5, maxPrice: 6.8 },
    { buyer: "Al Amal School", produce: "Oranges", qty: 300, dateOffset: 6, minPrice: 4.5, maxPrice: 5.5 },
    { buyer: "Al Amal School", produce: "Strawberries", qty: 150, dateOffset: 8, minPrice: 8.0, maxPrice: 10.0 },
  ];

  const requirementIds: Record<string, string> = {};
  for (const r of requirementDefs) {
    const buyer = buyerDefs.find((b) => b.businessName === r.buyer)!;
    const requirement = await prisma.requirement.create({
      data: {
        buyerProfileId: buyers[r.buyer].profileId,
        produceCategoryId: cat[r.produce],
        quantity: r.qty, unit: "kg",
        requiredDate: addDays(today, r.dateOffset),
        recurring: !!r.recurring, recurringFrequency: r.recurring ? "weekly" : undefined,
        deliveryLocationLabel: `${r.buyer} — ${buyer.city}`,
        deliveryAddress: `${buyer.city}, ${buyer.region}`,
        deliveryLatitude: buyer.lat, deliveryLongitude: buyer.lng,
        productionRequirement: "no_preference",
        minPrice: r.minPrice, maxPrice: r.maxPrice, priceUnit: "kg",
        status: REQUIREMENT_STATUS.ACTIVE,
      },
    });
    requirementIds[`${r.buyer}:${r.produce}`] = requirement.id;
  }

  console.log("Generating matches for all listings...");
  for (const listingId of Object.values(listingIds)) {
    await generateMatchesForListing(listingId);
  }

  console.log("Seeding sample offers, negotiations & orders (beyond the live demo pair)...");

  // 1) A PENDING offer for farmer3 to respond to (Sunrise Orchards Apples <- King Fahd Hospital)
  await prisma.offer.create({
    data: {
      listingId: listingIds["Sunrise Orchards:Apples"],
      requirementId: requirementIds["King Fahd Hospital:Apples"],
      buyerProfileId: buyers["King Fahd Hospital"].profileId,
      farmerProfileId: farmers["Sunrise Orchards"].profileId,
      quantity: 400, price: 6.2, priceUnit: "kg",
      deliveryDate: addDays(today, 5), deliveryMethod: "third_party",
      deliveryLocationLabel: "King Fahd Hospital — Riyadh",
      message: "Please confirm cold-chain packaging.",
      initiatedBy: "BUYER", status: OFFER_STATUS.PENDING,
    },
  });

  // 2) A COUNTERED offer with negotiation history (Coastal Greens Zucchini <- FreshMart, ad-hoc, no requirement)
  const negotiatedOffer = await prisma.offer.create({
    data: {
      listingId: listingIds["Coastal Greens:Zucchini"],
      buyerProfileId: buyers["FreshMart Supermarket"].profileId,
      farmerProfileId: farmers["Coastal Greens"].profileId,
      quantity: 200, price: 3.5, priceUnit: "kg",
      deliveryDate: addDays(today, 6), deliveryMethod: "farmer_delivery",
      deliveryLocationLabel: "FreshMart Supermarket — Riyadh",
      initiatedBy: "BUYER", status: OFFER_STATUS.COUNTERED,
    },
  });
  await prisma.negotiation.create({
    data: { offerId: negotiatedOffer.id, sender: "BUYER", price: 3.5, quantity: 200, rationale: "Opening offer" },
  });
  await prisma.negotiation.create({
    data: { offerId: negotiatedOffer.id, sender: "FARMER", price: 4.0, quantity: 200, rationale: "Organic certification and delivery cost" },
  });
  await prisma.offer.update({ where: { id: negotiatedOffer.id }, data: { price: 4.0 } });

  // 3) A fully COMPLETED order with reviews both ways (Green Valley Farms Lettuce -> Corner Grocery)
  const completedOffer = await prisma.offer.create({
    data: {
      listingId: listingIds["Green Valley Farms:Lettuce"],
      requirementId: requirementIds["Corner Grocery:Lettuce"],
      buyerProfileId: buyers["Corner Grocery"].profileId,
      farmerProfileId: farmers["Green Valley Farms"].profileId,
      quantity: 150, price: 2.8, priceUnit: "kg",
      deliveryDate: addDays(today, -3), deliveryMethod: "buyer_pickup",
      deliveryLocationLabel: "Corner Grocery — Al Kharj",
      initiatedBy: "BUYER", status: OFFER_STATUS.ACCEPTED,
    },
  });
  const completedOrder = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(), offerId: completedOffer.id,
      listingId: completedOffer.listingId, requirementId: completedOffer.requirementId,
      buyerProfileId: completedOffer.buyerProfileId, farmerProfileId: completedOffer.farmerProfileId,
      produceLabel: "Lettuce", quantity: 150, unit: "kg", agreedPrice: 2.8, priceUnit: "kg", totalValue: 420,
      deliveryDate: addDays(today, -3), deliveryMethod: "buyer_pickup", deliveryLocationLabel: "Corner Grocery — Al Kharj",
      status: ORDER_STATUS.COMPLETED,
      dispatchedAt: addDays(today, -3), deliveredAt: addDays(today, -3), confirmedAt: addDays(today, -3),
      receivedQuantity: 150, receivedCondition: "good",
      checklist: { create: DEFAULT_ORDER_CHECKLIST.map((task, i) => ({ task, completed: true, completedAt: addDays(today, -3), sortOrder: i })) },
    },
  });
  await prisma.requirement.update({ where: { id: requirementIds["Corner Grocery:Lettuce"] }, data: { status: REQUIREMENT_STATUS.FULFILLED } });
  await prisma.listing.update({ where: { id: listingIds["Green Valley Farms:Lettuce"] }, data: { status: LISTING_STATUS.COMPLETED } });
  await prisma.farmerProfile.update({ where: { id: farmers["Green Valley Farms"].profileId }, data: { completedOrders: { increment: 1 }, ratingAvg: 5, ratingCount: 1 } });
  await prisma.buyerProfile.update({ where: { id: buyers["Corner Grocery"].profileId }, data: { completedOrders: { increment: 1 }, ratingAvg: 5, ratingCount: 1 } });
  await prisma.review.create({ data: { orderId: completedOrder.id, reviewerId: buyers["Corner Grocery"].userId, reviewedPartyId: farmers["Green Valley Farms"].userId, rating: 5, comment: "Fresh lettuce, right on time." } });
  await prisma.review.create({ data: { orderId: completedOrder.id, reviewerId: farmers["Green Valley Farms"].userId, reviewedPartyId: buyers["Corner Grocery"].userId, rating: 5, comment: "Smooth pickup, great buyer." } });

  // 4) An order OUT FOR DELIVERY (Desert Bloom Farm Carrots -> King Fahd Hospital) to demo navigation/mark-delivered live
  const dispatchOffer = await prisma.offer.create({
    data: {
      listingId: listingIds["Desert Bloom Farm:Carrots"],
      requirementId: requirementIds["King Fahd Hospital:Carrots"],
      buyerProfileId: buyers["King Fahd Hospital"].profileId,
      farmerProfileId: farmers["Desert Bloom Farm"].profileId,
      quantity: 300, price: 2.9, priceUnit: "kg",
      deliveryDate: addDays(today, 1), deliveryMethod: "third_party",
      deliveryLocationLabel: "King Fahd Hospital — Riyadh",
      deliveryLatitude: 24.65, deliveryLongitude: 46.71,
      initiatedBy: "BUYER", status: OFFER_STATUS.ACCEPTED,
    },
  });
  await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(), offerId: dispatchOffer.id,
      listingId: dispatchOffer.listingId, requirementId: dispatchOffer.requirementId,
      buyerProfileId: dispatchOffer.buyerProfileId, farmerProfileId: dispatchOffer.farmerProfileId,
      produceLabel: "Carrots", quantity: 300, unit: "kg", agreedPrice: 2.9, priceUnit: "kg", totalValue: 870,
      deliveryDate: addDays(today, 1), deliveryMethod: "third_party", deliveryLocationLabel: "King Fahd Hospital — Riyadh",
      deliveryLatitude: 24.65, deliveryLongitude: 46.71,
      deliveryPersonType: "third_party", deliveryPersonName: "Al Wasel Logistics", deliveryContact: "+966501234567",
      status: ORDER_STATUS.OUT_FOR_DELIVERY, dispatchedAt: new Date(),
      checklist: { create: DEFAULT_ORDER_CHECKLIST.map((task, i) => ({ task, completed: true, completedAt: new Date(), sortOrder: i })) },
    },
  });
  await prisma.requirement.update({ where: { id: requirementIds["King Fahd Hospital:Carrots"] }, data: { status: REQUIREMENT_STATUS.FULFILLED } });
  await prisma.listing.update({ where: { id: listingIds["Desert Bloom Farm:Carrots"] }, data: { status: LISTING_STATUS.OUT_FOR_DELIVERY } });

  console.log("Seed complete.");
  console.log("");
  console.log("Demo accounts (password: demo1234)");
  console.log("  Farmer (Farm Al Noor):      farmer1@harvestlink.demo");
  console.log("  Buyer (Restaurant ABC):     buyer1@harvestlink.demo");
  console.log("  Admin:                      admin@harvestlink.demo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
