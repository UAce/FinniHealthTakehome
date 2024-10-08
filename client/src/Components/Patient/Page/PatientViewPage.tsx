import { Box, Button, Stack, Typography } from "@mui/material";
import {
  useGetPatientByIdQuery,
  useRemovePatientMutation,
} from "../../../Common/apiSlice";
import { useNavigate, useParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";
import { Delete, Edit } from "@mui/icons-material";
import { KeyValue } from "../../KeyValue";
import { PatientViewSection } from "./../PatientViewSection";
import { PatientStatusChip } from "./../PatientStatusChip";
import dayjs from "dayjs";
import { camelCaseToWords } from "../../../Common/utils";
import { ConfirmDialog } from "../../ConfirmDialog";
import { useState } from "react";
import { openToast } from "../../../Common/toastSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../Common/store";
import { Page } from "../../Layout/Page";
import { PatientNotFound } from "../PatientNotFound";

export const PatientViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [openDialog, setOpenDialog] = useState(false);

  const { isLoading, data, error } = useGetPatientByIdQuery(
    id ? id : skipToken
  );

  const [removePatientMutation] = useRemovePatientMutation();
  const handleDeletePatient = async (id: string) => {
    try {
      await removePatientMutation(id).unwrap();
      dispatch(
        openToast({
          severity: "success",
          title: "Patient profile deleted",
        })
      );
      navigate(`/patients`);
    } catch (error) {
      console.error(error);
      dispatch(
        openToast({
          severity: "error",
          title: "Error deleting patient profile",
        })
      );
    } finally {
      setOpenDialog(false);
    }
  };

  return (
    <Page
      isLoading={isLoading}
      title="Patient Profile"
      goBackRoute="/patients"
      error={error}
    >
      {data ? (
        <Box
          sx={{
            margin: "24px",
            maxWidth: "900px",
          }}
        >
          <Stack flexDirection="row" sx={{ justifyContent: "space-between" }}>
            <Stack flexDirection="row" alignItems="center" columnGap={0.5}>
              <Typography variant="h6">Status:</Typography>
              <PatientStatusChip status={data.status} />
            </Stack>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => navigate(`/patients/${data.id}/edit`)}
              sx={{ borderColor: "grey.500", color: "grey.700" }}
            >
              Edit
            </Button>
          </Stack>

          <PatientViewSection title="Personal Information">
            <KeyValue value={data.firstName} name="First Name" />
            <KeyValue value={data.middleName || "-"} name="Middle Name" />
            <KeyValue value={data.lastName} name="Last Name" />
            <KeyValue
              value={dayjs(data.dateOfBirth).format("LL")}
              name="Date of Birth"
            />
          </PatientViewSection>

          {data.addresses.map((address, index) => {
            return (
              <PatientViewSection
                key={`address-${index}`}
                title={`${address.type} Address`}
              >
                <KeyValue
                  value={`${address.line1} ${address.line2}`}
                  name="Address"
                />
                <KeyValue value={address.city} name="City" />
                <KeyValue value={address.area} name="Area" />
                <KeyValue value={address.country} name="Country" />
                <KeyValue value={address.postalCode} name="Postal Code" />
              </PatientViewSection>
            );
          })}

          {data.metadata.length > 0 ? (
            <PatientViewSection title="Additional Information">
              {data.metadata.map(({ key, value }, index) => {
                return (
                  <KeyValue
                    key={`metadata-${index}`}
                    value={value}
                    name={camelCaseToWords(key)}
                  />
                );
              })}
            </PatientViewSection>
          ) : null}

          <Button
            variant="contained"
            color="error"
            onClick={() => setOpenDialog(true)}
            startIcon={<Delete />}
          >
            Delete
          </Button>
          <ConfirmDialog
            confirmText="Delete"
            message="This will irreversibly delete the patient profile."
            title="Delete Patient Profile"
            onAccept={() => handleDeletePatient(data.id)}
            onCancel={() => setOpenDialog(false)}
            open={openDialog}
          />
        </Box>
      ) : (
        <PatientNotFound />
      )}
    </Page>
  );
};
