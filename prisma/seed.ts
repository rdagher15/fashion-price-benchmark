import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateMatchesForListing } from "../src/lib/matching";
import { generateOrderNumber } from "../src/lib/format";
import { DEFAULT_ORDER_CHECKLIST, LISTING_STATUS, REQUIREMENT_STATUS, OFFER_STATUS, ORDER_STATUS, BUYER_TYPES } from "../src/lib/constants";

const prisma = new PrismaClient();

function addDays(d: Date, days: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

let orderSeq = 0;
async function nextOrderNumber() {
  orderSeq += 1;
  return generateOrderNumber(orderSeq);
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
  await prisma.retailerDemandProfile.deleteMany();
  await prisma.buyerPhoto.deleteMany();
  await prisma.buyerDeliveryLocation.deleteMany();
  await prisma.farmerProfile.deleteMany();
  await prisma.buyerProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.produceCategory.deleteMany();
  await prisma.businessType.deleteMany();
  await prisma.matchingConfig.deleteMany();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const passwordHash = await bcrypt.hash("demo1234", 10);

  console.log("Seeding matching config (Lebanon weights: produce 25 / qty 15 / date 15 / distance 20 / delivery 10 / price 15)...");
  await prisma.matchingConfig.create({ data: { id: "singleton" } });

  console.log("Seeding business types...");
  for (const t of BUYER_TYPES) {
    await prisma.businessType.create({ data: { value: t.value, label: t.label } });
  }

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
    { family: "Leafy Greens", name: "Lettuce" },
    { family: "Leafy Greens", name: "Spinach" },
    { family: "Fruits", name: "Apples" },
    { family: "Fruits", name: "Oranges" },
    { family: "Fruits", name: "Lemons" },
    { family: "Herbs", name: "Mint" },
    { family: "Herbs", name: "Parsley" },
    { family: "Cereals", name: "Wheat" },
    { family: "Cereals", name: "Corn" },
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
      email: "admin@harvestlink.demo", phone: "+9611000000", passwordHash,
    },
  });

  console.log("Seeding Lebanese farmers...");
  type FarmerDef = {
    email: string; firstName: string; lastName: string; farmName: string; region: string; city: string;
    lat: number; lng: number; hasOwnVehicle: boolean; refrigerated: boolean; deliveryRadiusKm?: number;
    completionPct: number; organic: boolean;
  };
  const farmerDefs: FarmerDef[] = [
    { email: "farmer1@harvestlink.demo", firstName: "Georges", lastName: "Haddad", farmName: "Bekaa Valley Farms", region: "Bekaa", city: "Zahle", lat: 33.8463, lng: 35.9019, hasOwnVehicle: true, refrigerated: true, deliveryRadiusKm: 100, completionPct: 90, organic: false },
    { email: "farmer2@harvestlink.demo", firstName: "Fatima", lastName: "Youssef", farmName: "Akkar Green Fields", region: "Akkar", city: "Halba", lat: 34.5417, lng: 36.0819, hasOwnVehicle: false, refrigerated: false, completionPct: 60, organic: false },
    { email: "farmer3@harvestlink.demo", firstName: "Elie", lastName: "Khoury", farmName: "Chouf Terraces Farm", region: "Mount Lebanon", city: "Aley", lat: 33.8103, lng: 35.6019, hasOwnVehicle: true, refrigerated: true, deliveryRadiusKm: 60, completionPct: 85, organic: false },
    { email: "farmer4@harvestlink.demo", firstName: "Rania", lastName: "Abou Chakra", farmName: "Koura Olive & Citrus", region: "North Lebanon", city: "Tripoli", lat: 34.4367, lng: 35.8497, hasOwnVehicle: true, refrigerated: false, deliveryRadiusKm: 80, completionPct: 70, organic: true },
    { email: "farmer5@harvestlink.demo", firstName: "Hassan", lastName: "Fakih", farmName: "Nabatieh Fresh Farms", region: "Nabatieh", city: "Nabatieh", lat: 33.3789, lng: 35.4839, hasOwnVehicle: false, refrigerated: false, completionPct: 55, organic: false },
  ];

  const farmers: Record<string, { userId: string; profileId: string }> = {};
  for (const f of farmerDefs) {
    const user = await prisma.user.create({
      data: {
        role: "FARMER", status: "ACTIVE", firstName: f.firstName, lastName: f.lastName,
        email: f.email, phone: "+9613" + Math.floor(100000 + Math.random() * 899999), passwordHash,
        nationality: "Lebanon",
        farmerProfile: {
          create: {
            farmName: f.farmName, region: f.region, city: f.city, latitude: f.lat, longitude: f.lng,
            farmSizeValue: 5 + Math.random() * 25, farmSizeUnit: "hectares", farmType: "family",
            yearsOperating: 5 + Math.floor(Math.random() * 25), numWorkers: 2 + Math.floor(Math.random() * 12),
            hasOwnVehicle: f.hasOwnVehicle, vehicleType: f.hasOwnVehicle ? "Refrigerated pickup truck" : undefined,
            vehicleCapacity: f.hasOwnVehicle ? "2.5 tonnes" : undefined, refrigerated: f.refrigerated,
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

  console.log("Seeding Lebanese retailers...");
  type BuyerDef = {
    email: string; firstName: string; lastName: string; position: string; businessName: string; buyerType: string;
    governorate: string; caza: string; city: string; lat: number; lng: number; crNumber: string;
  };
  const buyerDefs: BuyerDef[] = [
    { email: "buyer1@harvestlink.demo", firstName: "Layal", lastName: "Nassar", position: "Restaurant Manager", businessName: "Beirut Bistro", buyerType: "restaurant", governorate: "Beirut", caza: "Beirut", city: "Beirut", lat: 33.8938, lng: 35.5018, crNumber: "1023456" },
    { email: "buyer2@harvestlink.demo", firstName: "Karim", lastName: "Sayegh", position: "Procurement Manager", businessName: "FreshMart Jal El Dib", buyerType: "supermarket", governorate: "Mount Lebanon", caza: "Metn", city: "Jal El Dib", lat: 33.9333, lng: 35.5833, crNumber: "1044821" },
    { email: "buyer3@harvestlink.demo", firstName: "Maya", lastName: "Chidiac", position: "Owner", businessName: "Antelias Corner Grocery", buyerType: "grocery", governorate: "Mount Lebanon", caza: "Metn", city: "Antelias", lat: 33.9142, lng: 35.5828, crNumber: "1058732" },
    { email: "buyer4@harvestlink.demo", firstName: "Tony", lastName: "Rahme", position: "General Manager", businessName: "Zalka Grand Hotel", buyerType: "hotel", governorate: "Mount Lebanon", caza: "Metn", city: "Zalka", lat: 33.9028, lng: 35.5581, crNumber: "1067543" },
    { email: "buyer5@harvestlink.demo", firstName: "Dania", lastName: "Aoun", position: "Purchasing Officer", businessName: "Jounieh Central Hospital", buyerType: "hospital", governorate: "Mount Lebanon", caza: "Kesrouan", city: "Jounieh", lat: 33.9808, lng: 35.6178, crNumber: "1071298" },
  ];

  const buyers: Record<string, { userId: string; profileId: string }> = {};
  for (const b of buyerDefs) {
    const user = await prisma.user.create({
      data: {
        role: "BUYER", status: "ACTIVE", firstName: b.firstName, lastName: b.lastName,
        email: b.email, phone: "+9613" + Math.floor(100000 + Math.random() * 899999), passwordHash,
        position: b.position,
        buyerProfile: {
          create: {
            businessName: b.businessName, buyerType: b.buyerType, contactPerson: `${b.firstName} ${b.lastName}`,
            crNumber: b.crNumber,
            governorate: b.governorate, caza: b.caza, city: b.city, street: "Main Street",
            latitude: b.lat, longitude: b.lng,
            businessPhone: "+9611" + Math.floor(100000 + Math.random() * 899999),
            verificationStatus: "VERIFIED", profileCompletionPct: 85,
            deliveryLocations: {
              create: [{ label: `${b.businessName} — main location`, address: `Main Street, ${b.city}, ${b.governorate}`, latitude: b.lat, longitude: b.lng, isPrimary: true }],
            },
          },
        },
      },
      include: { buyerProfile: true },
    });
    buyers[b.businessName] = { userId: user.id, profileId: user.buyerProfile!.id };
  }

  console.log("Seeding retailer demand profiles (recurring purchasing patterns, not orders)...");
  const demandDefs: { buyer: string; produce: string; qty: number; unit: string; frequency: string }[] = [
    { buyer: "Beirut Bistro", produce: "Tomatoes", qty: 500, unit: "kg", frequency: "weekly" },
    { buyer: "Beirut Bistro", produce: "Lettuce", qty: 150, unit: "kg", frequency: "2_3x_week" },
    { buyer: "FreshMart Jal El Dib", produce: "Potatoes", qty: 1000, unit: "kg", frequency: "weekly" },
    { buyer: "FreshMart Jal El Dib", produce: "Onions", qty: 800, unit: "kg", frequency: "weekly" },
    { buyer: "Antelias Corner Grocery", produce: "Potatoes", qty: 300, unit: "kg", frequency: "weekly" },
    { buyer: "Antelias Corner Grocery", produce: "Oranges", qty: 200, unit: "kg", frequency: "biweekly" },
    { buyer: "Zalka Grand Hotel", produce: "Potatoes", qty: 400, unit: "kg", frequency: "weekly" },
    { buyer: "Zalka Grand Hotel", produce: "Wheat", qty: 600, unit: "kg", frequency: "monthly" },
    { buyer: "Jounieh Central Hospital", produce: "Carrots", qty: 250, unit: "kg", frequency: "weekly" },
    { buyer: "Jounieh Central Hospital", produce: "Spinach", qty: 150, unit: "kg", frequency: "weekly" },
  ];
  for (const d of demandDefs) {
    await prisma.retailerDemandProfile.create({
      data: { buyerProfileId: buyers[d.buyer].profileId, produceCategoryId: cat[d.produce], typicalQuantity: d.qty, unit: d.unit, frequency: d.frequency },
    });
  }

  console.log("Seeding listings...");
  type ListingDef = {
    farm: string; produce: string; qty: number; minPrice: number; maxPrice: number; preferredPrice: number;
    fromOffset: number; untilOffset: number; delivery: string[]; organic?: boolean;
  };
  const listingDefs: ListingDef[] = [
    // Bekaa Valley Farms — includes the clustering demo listing (Potatoes)
    { farm: "Bekaa Valley Farms", produce: "Potatoes", qty: 1000, minPrice: 0.65, maxPrice: 0.85, preferredPrice: 0.78, fromOffset: 0, untilOffset: 14, delivery: ["farmer_delivery", "third_party"] },
    { farm: "Bekaa Valley Farms", produce: "Tomatoes", qty: 700, minPrice: 0.75, maxPrice: 0.95, preferredPrice: 0.85, fromOffset: 0, untilOffset: 12, delivery: ["farmer_delivery"] },
    { farm: "Bekaa Valley Farms", produce: "Lettuce", qty: 300, minPrice: 0.55, maxPrice: 0.70, preferredPrice: 0.62, fromOffset: 1, untilOffset: 10, delivery: ["third_party", "buyer_pickup"] },
    // Akkar Green Fields
    { farm: "Akkar Green Fields", produce: "Wheat", qty: 2000, minPrice: 0.40, maxPrice: 0.50, preferredPrice: 0.45, fromOffset: 2, untilOffset: 30, delivery: ["third_party"] },
    { farm: "Akkar Green Fields", produce: "Onions", qty: 900, minPrice: 0.45, maxPrice: 0.60, preferredPrice: 0.52, fromOffset: 0, untilOffset: 21, delivery: ["third_party", "buyer_pickup"] },
    { farm: "Akkar Green Fields", produce: "Cucumbers", qty: 400, minPrice: 0.60, maxPrice: 0.75, preferredPrice: 0.68, fromOffset: 1, untilOffset: 10, delivery: ["buyer_pickup"] },
    // Chouf Terraces Farm — near Beirut, the flagship single-match demo (Tomatoes)
    { farm: "Chouf Terraces Farm", produce: "Tomatoes", qty: 900, minPrice: 0.82, maxPrice: 0.95, preferredPrice: 0.88, fromOffset: 0, untilOffset: 14, delivery: ["farmer_delivery", "buyer_pickup"] },
    { farm: "Chouf Terraces Farm", produce: "Peppers", qty: 350, minPrice: 0.90, maxPrice: 1.10, preferredPrice: 1.00, fromOffset: 1, untilOffset: 12, delivery: ["farmer_delivery"] },
    { farm: "Chouf Terraces Farm", produce: "Eggplant", qty: 300, minPrice: 0.70, maxPrice: 0.85, preferredPrice: 0.78, fromOffset: 0, untilOffset: 12, delivery: ["farmer_delivery", "buyer_pickup"] },
    // Koura Olive & Citrus (organic)
    { farm: "Koura Olive & Citrus", produce: "Oranges", qty: 600, minPrice: 0.60, maxPrice: 0.75, preferredPrice: 0.68, fromOffset: 2, untilOffset: 20, delivery: ["third_party"], organic: true },
    { farm: "Koura Olive & Citrus", produce: "Lemons", qty: 300, minPrice: 0.85, maxPrice: 1.05, preferredPrice: 0.95, fromOffset: 1, untilOffset: 18, delivery: ["third_party", "buyer_pickup"], organic: true },
    { farm: "Koura Olive & Citrus", produce: "Zucchini", qty: 250, minPrice: 0.65, maxPrice: 0.80, preferredPrice: 0.72, fromOffset: 0, untilOffset: 12, delivery: ["third_party"], organic: true },
    // Nabatieh Fresh Farms
    { farm: "Nabatieh Fresh Farms", produce: "Spinach", qty: 200, minPrice: 0.75, maxPrice: 0.95, preferredPrice: 0.85, fromOffset: 0, untilOffset: 10, delivery: ["buyer_pickup"] },
    { farm: "Nabatieh Fresh Farms", produce: "Carrots", qty: 350, minPrice: 0.50, maxPrice: 0.65, preferredPrice: 0.58, fromOffset: 1, untilOffset: 16, delivery: ["buyer_pickup", "third_party"] },
    { farm: "Nabatieh Fresh Farms", produce: "Mint", qty: 80, minPrice: 1.50, maxPrice: 1.90, preferredPrice: 1.70, fromOffset: 0, untilOffset: 10, delivery: ["buyer_pickup"] },
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
        deliveryRadiusKm: l.delivery.includes("farmer_delivery") ? 100 : undefined,
        minPrice: l.minPrice, maxPrice: l.maxPrice, preferredPrice: l.preferredPrice, priceUnit: "kg",
        status: LISTING_STATUS.PUBLISHED,
      },
    });
    listingIds[`${l.farm}:${l.produce}`] = listing.id;
  }

  console.log("Seeding retailer requests (anonymous to farmers)...");
  type RequirementDef = { buyer: string; produce: string; qty: number; dateOffset: number; windowDays: number; maxPrice?: number; minPrice?: number; recurring?: boolean };
  const requirementDefs: RequirementDef[] = [
    // Clustering demo: three nearby Mount Lebanon buyers whose combined 1,000kg
    // exactly absorbs Bekaa Valley Farms' potato listing on the same day.
    { buyer: "FreshMart Jal El Dib", produce: "Potatoes", qty: 300, dateOffset: 3, windowDays: 1 },
    { buyer: "Antelias Corner Grocery", produce: "Potatoes", qty: 300, dateOffset: 3, windowDays: 1 },
    { buyer: "Zalka Grand Hotel", produce: "Potatoes", qty: 400, dateOffset: 3, windowDays: 1 },
    // Flagship single-match demo — Beirut Bistro / Chouf Terraces Farm tomatoes
    { buyer: "Beirut Bistro", produce: "Tomatoes", qty: 500, dateOffset: 2, windowDays: 2, maxPrice: 0.90 },
    // Other active requests for a fuller marketplace
    { buyer: "Beirut Bistro", produce: "Lettuce", qty: 150, dateOffset: 5, windowDays: 2, recurring: true },
    { buyer: "FreshMart Jal El Dib", produce: "Onions", qty: 700, dateOffset: 6, windowDays: 3, maxPrice: 0.58 },
    { buyer: "Antelias Corner Grocery", produce: "Oranges", qty: 200, dateOffset: 7, windowDays: 3 },
    { buyer: "Zalka Grand Hotel", produce: "Wheat", qty: 600, dateOffset: 10, windowDays: 5, maxPrice: 0.48 },
    { buyer: "Jounieh Central Hospital", produce: "Carrots", qty: 250, dateOffset: 4, windowDays: 2 },
    { buyer: "Jounieh Central Hospital", produce: "Spinach", qty: 150, dateOffset: 3, windowDays: 2 },
  ];

  const requirementIds: Record<string, string> = {};
  for (const r of requirementDefs) {
    const buyerDef = buyerDefs.find((b) => b.businessName === r.buyer)!;
    const requiredDate = addDays(today, r.dateOffset);
    const windowMs = r.windowDays * 24 * 60 * 60 * 1000;
    const requirement = await prisma.requirement.create({
      data: {
        buyerProfileId: buyers[r.buyer].profileId,
        produceCategoryId: cat[r.produce],
        quantity: r.qty, unit: "kg",
        requiredDate,
        dateMin: new Date(requiredDate.getTime() - windowMs),
        dateMax: new Date(requiredDate.getTime() + windowMs),
        recurring: !!r.recurring, recurringFrequency: r.recurring ? "weekly" : undefined,
        deliveryLocationLabel: `${r.buyer} — main location`,
        deliveryAddress: `Main Street, ${buyerDef.city}, ${buyerDef.governorate}`,
        deliveryLatitude: buyerDef.lat, deliveryLongitude: buyerDef.lng,
        productionRequirement: "no_preference",
        minPrice: r.minPrice, maxPrice: r.maxPrice, priceUnit: "kg",
        anonymous: true,
        status: REQUIREMENT_STATUS.ACTIVE,
      },
    });
    requirementIds[`${r.buyer}:${r.produce}`] = requirement.id;
  }

  console.log("Generating matches (with quantity+geo consolidation clustering) for all listings...");
  for (const listingId of Object.values(listingIds)) {
    await generateMatchesForListing(listingId);
  }

  console.log("Seeding sample offers, negotiations & orders (beyond the live demo pairs)...");

  // 1) A PENDING offer for farmer3 (Chouf Terraces Farm) to respond to.
  await prisma.offer.create({
    data: {
      listingId: listingIds["Chouf Terraces Farm:Peppers"],
      buyerProfileId: buyers["Antelias Corner Grocery"].profileId,
      farmerProfileId: farmers["Chouf Terraces Farm"].profileId,
      quantity: 150, price: 1.0, priceUnit: "kg",
      deliveryDate: addDays(today, 5), deliveryMethod: "farmer_delivery",
      deliveryLocationLabel: "Grocery business — Mount Lebanon",
      initiatedBy: "BUYER", status: OFFER_STATUS.PENDING,
    },
  });

  // 2) A fully COMPLETED order with digital signature + reviews both ways
  //    (Nabatieh Fresh Farms Spinach -> Antelias Corner Grocery).
  const completedOffer = await prisma.offer.create({
    data: {
      listingId: listingIds["Nabatieh Fresh Farms:Spinach"],
      buyerProfileId: buyers["Antelias Corner Grocery"].profileId,
      farmerProfileId: farmers["Nabatieh Fresh Farms"].profileId,
      quantity: 150, price: 0.85, priceUnit: "kg",
      deliveryDate: addDays(today, -3), deliveryMethod: "buyer_pickup",
      deliveryLocationLabel: "Antelias Corner Grocery — main location",
      initiatedBy: "BUYER", status: OFFER_STATUS.ACCEPTED,
    },
  });
  const completedOrder = await prisma.order.create({
    data: {
      orderNumber: await nextOrderNumber(), offerId: completedOffer.id,
      listingId: completedOffer.listingId,
      buyerProfileId: completedOffer.buyerProfileId, farmerProfileId: completedOffer.farmerProfileId,
      produceLabel: "Spinach", quantity: 150, unit: "kg", agreedPrice: 0.85, priceUnit: "kg", totalValue: 127.5,
      deliveryDate: addDays(today, -3), deliveryMethod: "buyer_pickup", deliveryLocationLabel: "Antelias Corner Grocery — main location",
      status: ORDER_STATUS.COMPLETED,
      dispatchedAt: addDays(today, -3), deliveredAt: addDays(today, -3), confirmedAt: addDays(today, -3),
      receivedQuantity: 150, receivedCondition: "good",
      quantityCorrect: true, qualityConfirmed: true, packagingConfirmed: true, deliveryAcceptable: true,
      signatureName: "Maya Chidiac", signedAt: addDays(today, -3),
      checklist: { create: DEFAULT_ORDER_CHECKLIST.map((task, i) => ({ task, completed: true, completedAt: addDays(today, -3), sortOrder: i })) },
    },
  });
  await prisma.listing.update({ where: { id: listingIds["Nabatieh Fresh Farms:Spinach"] }, data: { status: LISTING_STATUS.COMPLETED } });
  await prisma.farmerProfile.update({ where: { id: farmers["Nabatieh Fresh Farms"].profileId }, data: { completedOrders: { increment: 1 }, ratingAvg: 5, ratingCount: 1 } });
  await prisma.buyerProfile.update({ where: { id: buyers["Antelias Corner Grocery"].profileId }, data: { completedOrders: { increment: 1 }, ratingAvg: 5, ratingCount: 1 } });
  await prisma.review.create({ data: { orderId: completedOrder.id, reviewerId: buyers["Antelias Corner Grocery"].userId, reviewedPartyId: farmers["Nabatieh Fresh Farms"].userId, rating: 5, comment: "Fresh spinach, right on time." } });
  await prisma.review.create({ data: { orderId: completedOrder.id, reviewerId: farmers["Nabatieh Fresh Farms"].userId, reviewedPartyId: buyers["Antelias Corner Grocery"].userId, rating: 5, comment: "Smooth pickup, great buyer." } });

  // 3) An order OUT FOR DELIVERY (Akkar Green Fields Onions -> Jounieh Central Hospital).
  const dispatchOffer = await prisma.offer.create({
    data: {
      listingId: listingIds["Akkar Green Fields:Onions"],
      buyerProfileId: buyers["Jounieh Central Hospital"].profileId,
      farmerProfileId: farmers["Akkar Green Fields"].profileId,
      quantity: 300, price: 0.55, priceUnit: "kg",
      deliveryDate: addDays(today, 1), deliveryMethod: "third_party",
      deliveryLocationLabel: "Jounieh Central Hospital — main location",
      deliveryLatitude: 33.9808, deliveryLongitude: 35.6178,
      initiatedBy: "BUYER", status: OFFER_STATUS.ACCEPTED,
    },
  });
  await prisma.order.create({
    data: {
      orderNumber: await nextOrderNumber(), offerId: dispatchOffer.id,
      listingId: dispatchOffer.listingId,
      buyerProfileId: dispatchOffer.buyerProfileId, farmerProfileId: dispatchOffer.farmerProfileId,
      produceLabel: "Onions", quantity: 300, unit: "kg", agreedPrice: 0.55, priceUnit: "kg", totalValue: 165,
      deliveryDate: addDays(today, 1), deliveryMethod: "third_party", deliveryLocationLabel: "Jounieh Central Hospital — main location",
      deliveryLatitude: 33.9808, deliveryLongitude: 35.6178,
      deliveryPersonType: "third_party", deliveryPersonName: "Cedars Logistics", deliveryContact: "+9613123456",
      status: ORDER_STATUS.OUT_FOR_DELIVERY, dispatchedAt: new Date(),
      checklist: { create: DEFAULT_ORDER_CHECKLIST.map((task, i) => ({ task, completed: true, completedAt: new Date(), sortOrder: i })) },
    },
  });
  await prisma.listing.update({ where: { id: listingIds["Akkar Green Fields:Onions"] }, data: { status: LISTING_STATUS.OUT_FOR_DELIVERY } });

  // 4) A DISCREPANCY REPORTED order (Koura Olive & Citrus Oranges -> Beirut Bistro).
  const discOffer = await prisma.offer.create({
    data: {
      listingId: listingIds["Koura Olive & Citrus:Oranges"],
      buyerProfileId: buyers["Beirut Bistro"].profileId,
      farmerProfileId: farmers["Koura Olive & Citrus"].profileId,
      quantity: 200, price: 0.68, priceUnit: "kg",
      deliveryDate: addDays(today, -1), deliveryMethod: "third_party",
      deliveryLocationLabel: "Beirut Bistro — main location",
      initiatedBy: "BUYER", status: OFFER_STATUS.ACCEPTED,
    },
  });
  await prisma.order.create({
    data: {
      orderNumber: await nextOrderNumber(), offerId: discOffer.id,
      listingId: discOffer.listingId,
      buyerProfileId: discOffer.buyerProfileId, farmerProfileId: discOffer.farmerProfileId,
      produceLabel: "Oranges", quantity: 200, unit: "kg", agreedPrice: 0.68, priceUnit: "kg", totalValue: 136,
      deliveryDate: addDays(today, -1), deliveryMethod: "third_party", deliveryLocationLabel: "Beirut Bistro — main location",
      status: ORDER_STATUS.DISCREPANCY,
      dispatchedAt: addDays(today, -1), deliveredAt: addDays(today, -1),
      discrepancyTypesJson: JSON.stringify(["shortage", "quality"]),
      discrepancyNote: "Received 170kg instead of 200kg, and about a dozen crates showed bruising.",
      discrepancyReportedAt: addDays(today, -1),
      receivedQuantity: 170,
      checklist: { create: DEFAULT_ORDER_CHECKLIST.map((task, i) => ({ task, completed: true, completedAt: addDays(today, -1), sortOrder: i })) },
    },
  });

  console.log("Seed complete.");
  console.log("");
  console.log("Demo accounts (password: demo1234)");
  console.log("  Farmer (Chouf Terraces Farm, near Beirut): farmer3@harvestlink.demo");
  console.log("  Farmer (Bekaa Valley Farms, clustering):   farmer1@harvestlink.demo");
  console.log("  Buyer (Beirut Bistro):                     buyer1@harvestlink.demo");
  console.log("  Admin:                                     admin@harvestlink.demo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
