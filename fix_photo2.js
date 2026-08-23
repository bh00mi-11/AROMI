const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/PhotoCheck.tsx', 'utf-8');

const target = 	oast("??????? ??? — ???????? AI ???????? ?????????", { icon: "??" });
      setResult(DEMO_RESULT(childName, testStatus));;

const replacement = console.error("Analysis failed");
      toast.error("???????? ???? (Analysis failed). Please check OpenRouter configuration.");;

code = code.replace(target, replacement);

fs.writeFileSync('frontend/src/pages/PhotoCheck.tsx', code);
