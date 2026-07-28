// Seeds a handful of example public recipes owned by fake demo users, with
// ratings and comments, so the Explorar page and public recipe pages have
// realistic-looking content to preview.
//
//   node scripts/seed-public-recipes.mjs          # insert demo data
//   node scripts/seed-public-recipes.mjs --clean  # remove it again
//
// Everything it creates is tagged with source:"seed" (users) / seeded:true
// (recipes/ratings/comments), so --clean only removes seed data and never
// touches real accounts.
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI não definida");
  process.exit(1);
}

const AUTHORS = [
  { name: "Marina Costa", email: "seed-marina@shelf.demo" },
  { name: "Rafael Lima", email: "seed-rafael@shelf.demo" },
  { name: "Júlia Fernandes", email: "seed-julia@shelf.demo" },
];

const COMMENTERS = [
  "Pedro Alves",
  "Camila Rocha",
  "Lucas Martins",
  "Beatriz Souza",
  "Thiago Nunes",
];

const RECIPES = [
  {
    name: "Panqueca americana fofinha",
    category: "Café da manhã",
    prepTime: 20,
    servings: 4,
    imageUrl: "https://images.openfoodfacts.org/images/products/501/111/122/2333/front_en.4.400.jpg",
    ingredients: [
      { name: "Farinha de trigo", quantity: 2, unit: "xícara" },
      { name: "Leite", quantity: 1.5, unit: "xícara" },
      { name: "Ovo", quantity: 2, unit: "un" },
      { name: "Fermento em pó", quantity: 1, unit: "colher de sopa" },
    ],
    steps: [
      "Misture os secos numa tigela.",
      "Adicione o leite e os ovos e bata até ficar liso.",
      "Despeje conchas na frigideira quente e vire quando surgirem bolhas.",
    ],
  },
  {
    name: "Macarrão alho e óleo",
    category: "Massas",
    prepTime: 25,
    servings: 2,
    imageUrl: "https://images.openfoodfacts.org/images/products/789/602/220/0879/front_pt.3.400.jpg",
    ingredients: [
      { name: "Espaguete", quantity: 250, unit: "g" },
      { name: "Alho", quantity: 4, unit: "dente" },
      { name: "Azeite", quantity: 4, unit: "colher de sopa" },
      { name: "Salsinha", quantity: 1, unit: "pitada" },
    ],
    steps: [
      "Cozinhe o espaguete al dente.",
      "Doure o alho fatiado no azeite em fogo baixo.",
      "Misture o macarrão com o alho e finalize com salsinha.",
    ],
  },
  {
    name: "Salada de grão-de-bico",
    category: "Saladas",
    prepTime: 15,
    servings: 3,
    imageUrl: "",
    ingredients: [
      { name: "Grão-de-bico cozido", quantity: 2, unit: "xícara" },
      { name: "Tomate", quantity: 2, unit: "un" },
      { name: "Pepino", quantity: 1, unit: "un" },
      { name: "Limão", quantity: 1, unit: "un" },
    ],
    steps: [
      "Pique os legumes em cubos.",
      "Misture tudo com o grão-de-bico.",
      "Tempere com suco de limão, azeite e sal.",
    ],
  },
  {
    name: "Bolo de cenoura com cobertura",
    category: "Sobremesa",
    prepTime: 60,
    servings: 8,
    imageUrl: "https://images.openfoodfacts.org/images/products/560/131/210/6791/front_pt.6.400.jpg",
    ingredients: [
      { name: "Cenoura", quantity: 3, unit: "un" },
      { name: "Açúcar", quantity: 2, unit: "xícara" },
      { name: "Farinha de trigo", quantity: 2.5, unit: "xícara" },
      { name: "Ovo", quantity: 3, unit: "un" },
      { name: "Chocolate em pó", quantity: 4, unit: "colher de sopa" },
    ],
    steps: [
      "Bata cenoura, ovos, óleo e açúcar no liquidificador.",
      "Misture a farinha e o fermento à mão.",
      "Asse a 180°C por 40 minutos.",
      "Cubra com a calda de chocolate ainda quente.",
    ],
  },
  {
    name: "Sopa de legumes reconfortante",
    category: "Sopas",
    prepTime: 40,
    servings: 4,
    imageUrl: "",
    ingredients: [
      { name: "Batata", quantity: 3, unit: "un" },
      { name: "Cenoura", quantity: 2, unit: "un" },
      { name: "Abobrinha", quantity: 1, unit: "un" },
      { name: "Caldo de legumes", quantity: 1, unit: "L" },
    ],
    steps: [
      "Refogue os legumes picados.",
      "Cubra com o caldo e cozinhe até amaciar.",
      "Bata metade para dar cremosidade e ajuste o sal.",
    ],
  },
  {
    name: "Frango grelhado com limão",
    category: "Carnes",
    prepTime: 30,
    servings: 2,
    imageUrl: "",
    ingredients: [
      { name: "Filé de frango", quantity: 4, unit: "un" },
      { name: "Limão", quantity: 2, unit: "un" },
      { name: "Alho", quantity: 2, unit: "dente" },
      { name: "Azeite", quantity: 2, unit: "colher de sopa" },
    ],
    steps: [
      "Tempere o frango com limão, alho, sal e azeite por 20 minutos.",
      "Grelhe em fogo médio até dourar dos dois lados.",
      "Sirva com salada ou arroz.",
    ],
  },
  {
    name: "Vitamina de banana com aveia",
    category: "Bebida",
    prepTime: 5,
    servings: 1,
    imageUrl: "https://images.openfoodfacts.org/images/products/560/100/997/9370/front_pt.18.400.jpg",
    ingredients: [
      { name: "Banana", quantity: 1, unit: "un" },
      { name: "Leite", quantity: 1, unit: "xícara" },
      { name: "Aveia", quantity: 2, unit: "colher de sopa" },
    ],
    steps: ["Bata tudo no liquidificador até ficar homogêneo.", "Sirva gelado."],
  },
  {
    name: "Wrap vegetariano rápido",
    category: "Lanche",
    prepTime: 10,
    servings: 2,
    imageUrl: "",
    ingredients: [
      { name: "Tortilla", quantity: 2, unit: "un" },
      { name: "Alface", quantity: 4, unit: "fatia" },
      { name: "Tomate", quantity: 1, unit: "un" },
      { name: "Queijo", quantity: 2, unit: "fatia" },
    ],
    steps: [
      "Aqueça a tortilla rapidamente.",
      "Recheie com os vegetais e o queijo.",
      "Enrole firme e corte ao meio.",
    ],
  },
];

const COMMENT_TEXTS = [
  "Fiz ontem e ficou incrível, super recomendo!",
  "Simples e delicioso. Vou repetir!",
  "Adicionei um pouco de pimenta e ficou perfeito.",
  "Minha família amou, obrigado por compartilhar.",
  "Rendeu bastante e ficou pronto rapidinho.",
  "Substituí o leite por bebida vegetal e deu certo.",
];

// Deterministic-ish pseudo random so re-running gives similar spread without
// needing Math.random seeding.
function pick(arr, n) {
  return arr[n % arr.length];
}

async function main() {
  const clean = process.argv.includes("--clean");
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const users = db.collection("user");
  const recipes = db.collection("recipes");
  const ratings = db.collection("reciperatings");
  const comments = db.collection("recipecomments");

  if (clean) {
    const seedUsers = await users.find({ source: "seed" }).toArray();
    const ids = seedUsers.map((u) => u._id.toString());
    const r = await Promise.all([
      recipes.deleteMany({ seeded: true }),
      ratings.deleteMany({ seeded: true }),
      comments.deleteMany({ seeded: true }),
      users.deleteMany({ source: "seed" }),
    ]);
    console.log("Removido:", {
      recipes: r[0].deletedCount,
      ratings: r[1].deletedCount,
      comments: r[2].deletedCount,
      users: r[3].deletedCount,
      seedUserIds: ids.length,
    });
    await client.close();
    return;
  }

  // Reuse existing seed users if the script was run before.
  const authorIds = [];
  for (const author of AUTHORS) {
    const existing = await users.findOne({ email: author.email });
    if (existing) {
      authorIds.push(existing._id);
      continue;
    }
    const now = new Date();
    const result = await users.insertOne({
      name: author.name,
      email: author.email,
      emailVerified: false,
      source: "seed",
      createdAt: now,
      updatedAt: now,
    });
    authorIds.push(result.insertedId);
  }

  let recipesInserted = 0;
  let ratingsInserted = 0;
  let commentsInserted = 0;

  for (let i = 0; i < RECIPES.length; i++) {
    const def = RECIPES[i];
    const authorId = authorIds[i % authorIds.length];
    const now = new Date(Date.now() - i * 3600_000);

    // Skip if a seeded recipe with this name from this author already exists.
    const already = await recipes.findOne({ name: def.name, userId: authorId.toString(), seeded: true });
    if (already) continue;

    const recipeRes = await recipes.insertOne({
      name: def.name,
      ingredients: def.ingredients.map((ing) => ({ ...ing })),
      instructions: "",
      steps: def.steps,
      prepTime: def.prepTime,
      servings: def.servings,
      category: def.category,
      imageUrl: def.imageUrl,
      isPublic: true,
      userId: authorId.toString(),
      seeded: true,
      createdAt: now,
      updatedAt: now,
    });
    recipesInserted++;
    const recipeId = recipeRes.insertedId.toString();

    // 3–6 ratings per recipe from pseudo raters (userId strings that don't
    // need to be real accounts — ratings only need a unique userId each).
    const numRatings = 3 + (i % 4);
    for (let r = 0; r < numRatings; r++) {
      const stars = 4 + ((i + r) % 3); // 4..6, keeps demo averages pleasant
      await ratings.insertOne({
        recipeId,
        userId: `seed-rater-${i}-${r}`,
        stars: Math.min(6, stars),
        seeded: true,
        createdAt: now,
        updatedAt: now,
      });
      ratingsInserted++;
    }

    // 1–3 comments per recipe.
    const numComments = 1 + (i % 3);
    for (let c = 0; c < numComments; c++) {
      await comments.insertOne({
        recipeId,
        userId: `seed-commenter-${i}-${c}`,
        authorName: pick(COMMENTERS, i + c),
        text: pick(COMMENT_TEXTS, i * 2 + c),
        seeded: true,
        createdAt: new Date(now.getTime() + c * 60_000),
        updatedAt: now,
      });
      commentsInserted++;
    }
  }

  console.log("Inserido:", {
    recipes: recipesInserted,
    ratings: ratingsInserted,
    comments: commentsInserted,
    authors: authorIds.length,
  });
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
