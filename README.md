🏥 E-Health Somaliland Platform
📌 Overview
The E-Health Somaliland Platform is a mission-driven full-stack web application designed to digitize and secure healthcare services in Somaliland. By connecting patients, doctors, and pharmacies into a single "Chain of Trust," the platform eliminates the dangerous gaps in traditional healthcare delivery.

🛑 The Problem We Solve
In many regions, the healthcare system faces critical challenges that put citizens' lives at risk. This platform is specifically designed to combat:

Illegal Medicine Sales: Preventing the distribution of medicine without a valid, verifiable doctor's order.

Unlicensed Pharmacies: Stopping the purchase of low-quality or expired drugs from unregulated vendors.

Self-Medication Dangers: Curbing the habit of taking high-risk medications (like antibiotics) without a professional diagnosis.

Healthcare Deserts: Providing a digital lifeline for people in remote areas who lack physical access to a clinic.

🎯 Project Goals
✅ Digitize Healthcare: Moving from paper-based risks to secure digital records.

✅ Verify Every Pill: Using QR-coded prescriptions to ensure medicine only comes from licensed pharmacies.

✅ Kill the Black Market: Making it impossible to forge or reuse old prescriptions for illegal sales.

✅ Emergency Response: Connecting citizens to the nearest hospital or ambulance instantly.

✅ Public Education: Providing built-in health tips to improve community wellness and hygiene.

👥 User Roles
🧑‍⚕️ Patient
Consult: Request medical help and track status in real-time.

Verified Rx: Receive secure prescriptions that cannot be altered.

Pharmacy Finder: Use an interactive map to locate only licensed and trusted pharmacies.

Education: Access health tips on hydration, hygiene, and disease prevention.

👨‍⚕️ Doctor
Manage Requests: View and serve pending consultations efficiently.

Digital Prescribing: Issue prescriptions with embedded security data (Doctor ID, Hospital, Phone).

Fraud Prevention: Every prescription generates a unique QR code that links back to the licensed practitioner.

💊 Pharmacist (Security-First)
QR Verification: Scan codes to see the doctor’s credentials and hospital info.

Authenticity Check: Ensures the medicine hasn't been expired or tampered with.

⚙️ How the System Works (The Chain of Trust)
Consultation: Patient submits symptoms via the dashboard.

Diagnosis: Doctor reviews, selects the patient, and enters a prescription.

QR Generation: The system locks the doctor's name, phone, hospital, and medicine list into a high-density QR code.

Verification: The patient presents the QR (digital or printed). The pharmacist scans it to verify the doctor's license before dispensing. This prevents unprescribed medicine sales.

🧠 Key Features
🔐 Secure QR Code System: Encrypts prescription data to prevent fraud.

🗺️ Licensed Pharmacy Map: Integrated Leaflet.js map showing verified locations in Hargeisa, Berbera, Borama, and beyond.

🌐 Multi-language: Full support for English and Somali.

📜 Printable Prescriptions: Doctors can generate professional slips for patients without smartphones.

⚡ Health Education: Real-time tips on the dashboard to promote preventative care.

🏗️ Tech Stack
Frontend: Vanilla JS, HTML5, CSS3, Leaflet.js (Maps), QRious (QR Generation).

Backend: Node.js, Express.js.

Database: SQLite (via Knex.js) for lightweight, portable data management.

DevOps: Docker, HAProxy (Load Balancing).

🧪 Testing the System
Preventing Illegal Sales (Test Case)
Attempt to access the "Prescription" page without a Doctor login (System blocks access).

Issue a prescription and scan the QR with a phone.

Verify: Does it show the Doctor’s phone and Hospital? If yes, the pharmacy can now call the doctor to verify if they are suspicious of the patient.

👨‍💻 Author
Gulaid Ahmed Abdi Software Engineering Student African Leadership University

🌟 Impact Vision
This project is more than code; it is a solution for a healthier Somaliland. By stopping the sale of unprescribed medicine and verifying pharmacy licenses, we save lives. We are building a future where High-Quality Healthcare is not a luxury for the few, but a right for every citizen, everywhere.