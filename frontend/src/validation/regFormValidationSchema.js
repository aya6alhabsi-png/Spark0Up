import * as yup from "yup";

const regFormValidationSchema = yup.object().shape({
  name: yup
    .string()
    .required("Name is required")
    .matches(/^[A-Za-z\s]+$/, "Name without special characters")
    .max(20, "Name must be less than 20 characters"),

 email: yup
  .string()
  .required("Email is required")
  .matches(/^\S+$/, "Email must not contain spaces")
  .matches(/^[A-Za-z]/, "Email must start with a letter")
  .matches(/^(?!.*\.\.)/,"Email must not contain consecutive dots")
  .email("Invalid email address"),


 phone: yup
  .string()
  .required("Phone number is required")
  .matches(
    /^[279]\d{7}$/,
    "Phone number must be 8 digits and start with 2, 7, or 9"
  ),
  

  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /[@$!%*?&#^()_\-+=]/,
      "Password must contain at least one special character"
    ),

  confirmPassword: yup
    .string()
    .required("Confirm Password is required")
    .oneOf([yup.ref("password")], "Passwords must match"),
});

export default regFormValidationSchema;
