module.exports = {
  "*": () => ["npm run check-secret", "npm run format"],
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "eslint"],
  "**/*.ts?(x)": () => "npm run check-types",
};
