# Nx Application Setup

### Installation
To install dependencies, run:
```sh
pnpm install
```

### Build Applications
To build all applications in parallel (3 at a time), run:
```sh
pnpm nx run-many --target=build --all --parallel=3
```

### Prisma Errors Troubleshooting
If you encounter Prisma errors, follow these steps:
1. Check if Prisma client is installed:
   ```sh
   pnpm list @prisma/client
   ```
2. If not installed, add it:
   ```sh
   pnpm add @prisma/client
   ```
3. Regenerate Prisma client:
   ```sh
   pnpm prisma generate
   ```
4. Start the server:
   ```sh
   pnpm nx serve server
   ```

---

# Basic Reactive Resume JSON Format

```json
{
  "basics": {
    "name": "KRISHNAMRAJU KAMMILI",
    "headline": "Full Stack Developer & DevOps Engineer",
    "email": "kkrajus777@gmail.com",
    "phone": "469-569-6257",
    "location": "",
    "url": {
      "label": "",
      "href": ""
    },
    "customFields": [],
    "picture": {
      "url": "https://i.imgur.com/fTmUbG2.jpeg",
      "size": 64,
      "aspectRatio": 0.75,
      "borderRadius": 0,
      "effects": {
        "hidden": false,
        "border": false,
        "grayscale": false
      }
    }
  },
  "sections": {
    "summary": {
      "name": "Summary",
      "columns": 1,
      "visible": true,
      "id": "summary",
      "content": "Accomplished Full Stack Developer and DevOps Engineer with 7-8 years of experience in dynamic environments. Expertise in React.js, Angular, Vue.js, Node.js, and DevOps methodologies. Recognized for prototyping over 70 product features annually at Lumen, earning the 2022 Employee of the Year award and recently awarded Most Valuable Associate (MVA) at Fidelity for Q2 2024, credited for consistent productivity and effective issue resolution."
    },
    "education": {
      "name": "Education",
      "columns": 1,
      "visible": true,
      "id": "education",
      "items": [
        {
          "institution": "University of Illinois at Springfield, IL",
          "studyType": "Master of Science in Computer Science",
          "date": "2015-09-01 - 2019-06-01"
        }
      ]
    },
    "experience": {
      "name": "Experience",
      "columns": 1,
      "visible": true,
      "id": "experience",
      "items": [
        {
          "company": "Fidelity",
          "position": "SR Front End Developer",
          "date": "2023-05-01 - Present"
        },
        {
          "company": "Lumen",
          "position": "SR JavaScript Full Stack Developer",
          "date": "2021-10-01 - 2023-05-01"
        },
        {
          "company": "Verizon",
          "position": "Full Stack Developer (React, Node)",
          "date": "2019-12-01 - 2021-09-01"
        }
      ]
    },
    "skills": {
      "name": "Skills",
      "columns": 1,
      "visible": true,
      "id": "skills",
      "items": [
        {
          "name": "Frontend Technologies",
          "keywords": ["React.js", "Angular", "Vue.js", "JavaScript", "HTML5", "CSS3"]
        },
        {
          "name": "Backend Technologies",
          "keywords": ["Node.js", "Express", "Nest", "Java", "Spring Boot", "MongoDB"]
        }
      ]
    }
  }
}
```




