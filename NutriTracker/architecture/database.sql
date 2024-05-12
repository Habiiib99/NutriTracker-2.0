-- ** I denne fil kan diverse tabeller der er lavet i databasen ses. **

CREATE TABLE dbo.ingredients ( -- Opretter en tabel til ingredienser
    ingredientId INT IDENTITY(1,1) PRIMARY KEY NOT NULL, -- Unik identifikator som primary key
    ingredient VARCHAR(255) NOT NULL, -- Navn på ingrediens
    kcal DECIMAL NOT NULL, -- Kalorier i ingrediens
    protein DECIMAL NOT NULL, -- Protein i ingrediens
    fat DECIMAL NOT NULL, -- Fedt i ingrediens
    fiber DECIMAL NOT NULL -- Fiber i ingrediens
);

CREATE TABLE dbo.profiles ( -- Opretter en tabel til brugere
    userId INT IDENTITY(1,1) PRIMARY KEY NOT NULL, -- Unik identifikator som primary key
    name VARCHAR(255) NOT NULL, -- Navn på brugeren
    age INT NOT NULL, -- Alder på brugeren
    gender VARCHAR(255) NOT NULL, -- Køn på brugeren
    weight DECIMAL NOT NULL, -- Vægt på brugeren
    email VARCHAR(255) NOT NULL, -- Email på brugeren
    password VARCHAR(255) NOT NULL, -- Password på brugeren
    bmr DECIMAL NOT NULL -- Basal metabolic rate
);

CREATE TABLE dbo.meals ( -- Opretter en tabel til måltider
    mealId INT IDENTITY(1,1) PRIMARY KEY NOT NULL, -- Unik identifikator som primary key
    mealName VARCHAR(255) NOT NULL, -- Navn på måltid
    userId INT NOT NULL, -- Reference til brugeren
    kcal DECIMAL, -- Kalorier i måltidet
    protein DECIMAL, -- Protein i måltidet
    fat DECIMAL, -- Fedt i måltidet
    fiber DECIMAL, -- Fiber i måltidet
    ingredients VARCHAR(255), -- Ingredienser i måltidet
    FOREIGN KEY (userId) REFERENCES dbo.profiles(userId) -- Definere foreign key constraint til brugeren
);

CREATE TABLE dbo.tracker ( -- Opretter en tabel til meal tracker
    trackerId INT PRIMARY KEY IDENTITY(1,1) NOT NULL, -- Unik identifikator som primary key
    mealId INT,  -- Reference til måltid
    mealIngredientId INT, -- Reference til måltidsingrediens
    weight DECIMAL NOT NULL, -- Vægt af måltidet i gram
    userId INT NOT NULL, -- Reference til brugeren
    consumptionDate DATETIME NOT NULL DEFAULT GETDATE(), -- Dato for indtagelse af måltidet
    location VARCHAR(255) NOT NULL, -- Lokation for indtagelse af måltidet
    FOREIGN KEY (mealId) REFERENCES dbo.meals(mealId), -- Tilføje foreign key constraint til måltid
    FOREIGN KEY (mealIngredientId) REFERENCES dbo.meal_ingredients(mealIngredientId), -- Tilføje foreign key constraint til måltidsingrediens
    FOREIGN KEY (userId) REFERENCES dbo.profiles(userId) -- Tilføje foreign key constraint til brugeren
);

CREATE TABLE dbo.activities ( -- Opretter en tabel til aktiviteter
    activityId INT PRIMARY KEY IDENTITY(1,1) NOT NULL, -- Unik identifikator som primary key
    userId INT NOT NULL, -- Reference til brugeren
    activityType VARCHAR(255) NOT NULL, -- Type af aktivitet
    duration DECIMAL NOT NULL, -- Varighed af aktivitet i minutter
    caloriesBurned DECIMAL NOT NULL, -- Kalorier forbrændt under aktiviteten
    activityDate DATETIME NOT NULL, -- Dato for aktiviteten
    activityName VARCHAR(255) NOT NULL, -- Navn på aktiviteten
    FOREIGN KEY (userId) REFERENCES dbo.profiles(userId) -- Definere foreign key constraint til brugeren
);

CREATE TABLE dbo.meal_ingredients ( -- Opretter en tabel til måltidsingredienser
    mealIngredientId INT PRIMARY KEY IDENTITY(1,1) NOT NULL, -- Unik identifikator som primary key
    ingredientId INT NOT NULL, -- Reference til ingrediens
    weightOfIngredient DECIMAL NOT NULL, -- Vægt af ingrediens i gram
    userId INT NOT NULL, -- Tilføje userId
    FOREIGN KEY (ingredientId) REFERENCES dbo.ingredients(ingredientId), -- Definere foreign key constraint til ingrediens
    FOREIGN KEY (userId) REFERENCES dbo.profiles(userId) -- Definere foreign key constraint til brugeren
);

CREATE TABLE dbo.waterRegistration ( -- Opretter en tabel til vandregistreringer
    waterRegId INT IDENTITY(1,1) PRIMARY KEY,  -- Unik identifikator
    userId INT NOT NULL,  -- Reference til brugeren
    amountOfWater INT NOT NULL,  -- Mængde vand i ml
    dateAndTimeOfDrinking DATETIME NOT NULL,  -- Tidspunkt for vandindtaget
    FOREIGN KEY (userId) REFERENCES dbo.profiles(userId) ON DELETE CASCADE,  -- Sletning kaskaderer til vandregistreringer ved sletning af bruger
    location VARCHAR(255) NOT NULL DEFAULT 'Unknown'  -- Lokation for vandindtaget
);

