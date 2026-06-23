import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { getDictionary } from "@/shared/i18n/get-dictionary";
import { routes } from "@/shared/lib/routing/routes";

export default async function NotFound() {
  const { dict } = await getDictionary();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        p: 2,
        textAlign: "center",
      }}
    >
      <Typography variant="h2" component="h1">
        {dict.notFound.title}
      </Typography>
      <Typography color="text.secondary">{dict.notFound.message}</Typography>
      <Button variant="contained" href={routes.home()}>
        {dict.notFound.backHome}
      </Button>
    </Box>
  );
}
