// controllers/plantController.js
const pool = require('../config/db');

// Funcție ajutătoare pentru a formata datele unei plante
const formatPlantData = (plant) => {
    const care_guide = {};
    if (plant.care_guide_data) {
        plant.care_guide_data.split('||').forEach(item => {
            const parts = item.split(';;');
            if (parts.length >= 4) {
                const [key, title, level, description, tip] = parts;
                care_guide[key] = { title, level, description, tip: tip || null };
            }
        });
    }

    return {
        id: plant.id,
        emoji: plant.emoji,
        image: plant.image,
        name: plant.name,
        latin: plant.latin_name,
        tags: plant.tags ? plant.tags.split('||') : [],
        category: plant.category,
        toxicity: {
            cats: plant.toxicity_cats,
            dogs: plant.toxicity_dogs
        },
        toxicityLevel: plant.toxicity_level,
        difficulty: plant.difficulty,
        origin: plant.origin,
        size: plant.size,
        lifespan: plant.lifespan,
        desc: plant.description,
        air_purifying_level: plant.air_purifying_level,
        blooming: plant.blooming,
        growth_rate: plant.growth_rate,
        seasonal_care: {
            growing_season: plant.growing_season,
            dormant_season: plant.dormant_season
        },
        common_pests: plant.common_pests ? plant.common_pests.split('||') : [],
        quick_facts: plant.quick_facts ? plant.quick_facts.split('||') : [],
        care_guide: care_guide,
        classification: {
            kingdom: plant.kingdom,
            subkingdom: plant.subkingdom,
            superdivision: plant.superdivision,
            division: plant.division,
            class: plant.class,
            subclass: plant.subclass,
            order: plant.order,
            family: plant.family,
            genus: plant.genus,
            species: plant.species
        }
    };
};


// Obține o listă SIMPLIFICATĂ cu toate plantele
const getAllPlants = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute(`
            SELECT 
                p.id, p.name, p.latin_name, p.emoji, p.image, p.category, p.difficulty, -- Am adăugat p.difficulty
                p.air_purifying_level, -- <-- ADAUGAT
                p.growth_rate,         -- <-- ADAUGAT
                tox.toxicity_level, -- Am adăugat toxicity_level
                GROUP_CONCAT(t.name SEPARATOR '||') AS tags
            FROM plants p
            LEFT JOIN toxicity tox ON p.id = tox.plant_id -- Am adăugat acest JOIN
            LEFT JOIN plant_tags pt ON p.id = pt.plant_id
            LEFT JOIN tags t ON pt.tag_id = t.id
            GROUP BY p.id;
        `);

        const plants = rows.map(plant => ({
            id: plant.id,
            name: plant.name,
            latin: plant.latin_name,
            emoji: plant.emoji,
            image: plant.image,
            category: plant.category,
            tags: plant.tags ? plant.tags.split('||') : [],
            difficulty: plant.difficulty, // Am adăugat câmpul difficulty
            toxicityLevel: plant.toxicity_level, // Am adăugat câmpul toxicityLevel
            air_purifying_level: plant.air_purifying_level, // <-- ADAUGAT
            growth_rate: plant.growth_rate                 // <-- ADAUGAT
        }));

        res.status(200).json(plants);
    } catch (error) {
        console.error("Eroare la preluarea listei de plante:", error);
        res.status(500).json({ message: "Eroare internă server.", error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// Obține TOATE detaliile pentru o singură plantă
const getPlantById = async (req, res) => {
    let connection;
    const { id } = req.params;

    try {
        connection = await pool.getConnection();
        await connection.execute('SET SESSION group_concat_max_len = 100000;');

        const [rows] = await connection.execute(`
            SELECT
                p.*,
                tox.cats AS toxicity_cats, tox.dogs AS toxicity_dogs, tox.toxicity_level,
                sc.growing_season, sc.dormant_season,
                cls.kingdom, cls.subkingdom, cls.superdivision, cls.division, cls.class, cls.subclass, cls.order AS \`order\`, cls.family, cls.genus, cls.species,
                GROUP_CONCAT(DISTINCT t.name SEPARATOR '||') AS tags,
                GROUP_CONCAT(DISTINCT cp.pest SEPARATOR '||') AS common_pests,
                GROUP_CONCAT(DISTINCT qf.fact SEPARATOR '||') AS quick_facts,
                GROUP_CONCAT(DISTINCT CONCAT_WS(';;', cg.section_key, cg.title, cg.level, cg.description, cg.tip) SEPARATOR '||') AS care_guide_data
            FROM plants p
            LEFT JOIN toxicity tox ON p.id = tox.plant_id
            LEFT JOIN seasonal_care sc ON p.id = sc.plant_id
            LEFT JOIN classification cls ON p.id = cls.plant_id
            LEFT JOIN plant_tags pt ON p.id = pt.plant_id
            LEFT JOIN tags t ON pt.tag_id = t.id
            LEFT JOIN common_pests cp ON p.id = cp.plant_id
            LEFT JOIN quick_facts qf ON p.id = qf.plant_id
            LEFT JOIN care_guide cg ON p.id = cg.plant_id
            WHERE p.id = ?
            GROUP BY p.id;
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Planta nu a fost găsită." });
        }

        const plantData = formatPlantData(rows[0]);
        res.status(200).json(plantData);

    } catch (error) {
        console.error(`Eroare la preluarea plantei cu ID ${id}:`, error);
        res.status(500).json({ message: "Eroare internă server.", error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    getAllPlants,
    getPlantById
};