export const isValidString = (str: string): boolean => {
  return (
    typeof str === "string" && str.trim().length > 0 && str.trim().length >= 4
  );
};

export const normalizeString = (str: string): string => {
  return str.trim().toLocaleLowerCase();
};

const passwordRegex = /^(?=\w*[a-z])\S{3,16}$/;

export const isValidPassword = (str: string): boolean => {
  return passwordRegex.test(str);
};
