require("dotenv").config();
const { run, one } = require("./turso");
const { id } = require("../utils/ids");
async function seed() {
  if (await one("SELECT id FROM subjects LIMIT 1")) { console.log("Seed skipped."); return; }
  const subjects = [
    ["Use of English", "ENG", "Arts"],
    ["Mathematics", "MTH", "Science"],
    ["Physics", "PHY", "Science"],
    ["Chemistry", "CHM", "Science"],
    ["Biology", "BIO", "Science"],
    ["Literature-in-English", "LIT", "Arts"],
    ["Economics", "ECO", "Commercial"],
    ["Government", "GOV", "Arts"],
  ];
  const ids = {};
  for (const [name, code, category] of subjects) {
    ids[code] = id();
    await run("INSERT INTO subjects (id, name, code, category, icon_name, total_questions_count, syllabus_version, exam_suites) VALUES (?, ?, ?, ?, ?, 0, '2026', 'JAMB,WAEC,POST-UTME,BECE,NCEE')", [ids[code], name, code, category, code]);
  }
  const passageId = id();
  await run("INSERT INTO passages (id, subject_id, title, passage_body) VALUES (?, ?, ?, ?)", [passageId, ids.ENG, "Market Day in Ibadan", "The market woke before the sun. Traders laid out peppers in neat red rows. A visitor could learn the price of yam and the mood of the city in one hour."]);
  const samples = [
    [ids.ENG, 2024, "JAMB", passageId, "What could a visitor learn in one hour?", "Only yam price", "Yam price and the mood of the city", "How to farm", "Every trader name", "B", "The last sentence names yam price and city mood."],
    [ids.MTH, 2023, "JAMB", null, "If 2x + 6 = 18, what is x?", "4", "6", "8", "12", "B", "2x = 12, so x = 6."],
    [ids.MTH, 2022, "WAEC", null, "What is 15 percent of 80?", "8", "10", "12", "15", "C", "15/100 times 80 is 12."],
    [ids.PHY, 2021, "JAMB", null, "20 m east then 15 m north. Displacement is closest to", "5 m", "25 m", "35 m", "7 m", "B", "Square 20 and 15, add, then take square root: 25."],
    [ids.CHM, 2020, "WAEC", null, "Symbol for sodium?", "So", "Na", "Sd", "Sm", "B", "From the older name natrium."],
    [ids.BIO, 2024, "JAMB", null, "Photosynthesis mainly happens in the", "roots", "flowers", "leaves", "seeds", "C", "Leaves hold most chlorophyll."],
    [ids.ECO, 2023, "JAMB", null, "Demand is elastic when", "price change causes a larger quantity change", "price never changes", "supply is fixed", "income is zero", "A", "Buyers change quantity by more than the price change."],
    [ids.GOV, 2022, "WAEC", null, "A written set of national rules is a", "manifesto", "constitution", "gazette", "communique", "B", "The constitution is the main rule book."],
    [ids.LIT, 2024, "JAMB", null, "A story acted on stage is a", "novel", "epic", "drama", "ballad", "C", "Drama is written to be performed."],
  ];
  for (const q of samples) {
    await run("INSERT INTO questions (id, subject_id, year, exam_type, passage_id, question_text, option_a, option_b, option_c, option_d, correct_option, detailed_explanation, difficulty_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Medium')", [id(), ...q]);
  }
  await run("INSERT INTO literature_books (id, subject_id, title, author, genre, full_summary, themes, character_profiles_json, key_quotes_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [id(), ids.LIT, "The Lion and the Jewel", "Wole Soyinka", "Drama", "A village play about tradition and change.", "Tradition versus change", "[{\"name\":\"Sidi\",\"role\":\"The Jewel\"}]", "[]"]);
  await run("INSERT INTO institution_cutoffs (id, institution_name, institution_type, course_name, jamb_cutoff, post_utme_cutoff, required_o_level_subjects_json, required_jamb_combination_json) VALUES (?, 'University of Ibadan', 'Federal', 'Medicine and Surgery', 200, 70, '[\"English\",\"Biology\",\"Chemistry\",\"Physics\"]', '[\"Use of English\",\"Biology\",\"Chemistry\",\"Physics\"]')", [id()]);
  await run("INSERT INTO activation_keys (id, key_code, is_used) VALUES (?, 'TDRL-DEMO-2026-TEST', 0)", [id()]);
  await run("INSERT INTO flashcards (id, subject_id, front_question, back_answer, mastery_level) VALUES (?, ?, 'Symbol for sodium?', 'Na', 0)", [id(), ids.CHM]);
  await seedDictionary();
  console.log("Sample seed complete.");
}
seed().catch((err) => { console.error(err.message); process.exit(1); });

async function seedDictionary() {
  const words = [
    ["elastic", "adjective", "Stretching more than the price change when buyers react.", "Demand is elastic when a small price rise cuts sales a lot.", "Economics"],
    ["natrium", "noun", "Older name for sodium, which is why the symbol is Na.", "Natrium explains the symbol Na.", "Chemistry"],
    ["displacement", "noun", "Straight-line change in position, not the path walked.", "20 m east and 15 m north give 25 m displacement.", "Physics"],
    ["chlorophyll", "noun", "Green pigment that traps light for photosynthesis.", "Leaves hold most chlorophyll.", "Biology"],
    ["constitution", "noun", "Written set of national rules.", "A constitution limits what a government may do.", "Government"],
    ["passage", "noun", "A short text you read before comprehension questions.", "Read the passage before the options.", "English"]
  ];
  for (const [word, pos, definition, example, hint] of words) {
    await run("INSERT INTO dictionary_entries (id, word, part_of_speech, definition, example_sentence, exam_hint) VALUES (?, ?, ?, ?, ?, ?)", [id(), word, pos, definition, example, hint]);
  }
}

