import { Request, Response } from "express";
import Joi from "joi";
import Logger from "../common/logger";
import PatientModel, {
  AddressType,
  IntakeStatus,
} from "../models/patientModel";
import { assertSchema, assertValue } from "../common/assert";
import { Types } from "mongoose";

const logger = Logger.getInstance({ name: "EditPatient" });

const EditPatientRequestSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  middleName: Joi.string().optional().allow(null, ""),
  dateOfBirth: Joi.date().optional(),
  status: Joi.string()
    .valid(...Object.values(IntakeStatus))
    .optional(),
  addresses: Joi.array()
    .items(
      Joi.object({
        type: Joi.string()
          .valid(...Object.values(AddressType))
          .required(),
        line1: Joi.string().required(),
        line2: Joi.string().optional().allow(null, ""),
        city: Joi.string().required(),
        area: Joi.string().required(),
        country: Joi.string().required(),
        postalCode: Joi.string().required(),
      }).optional()
    )
    .optional(),
  metadata: Joi.array()
    .items(
      Joi.object({
        key: Joi.string().required(),
        value: Joi.string().required(),
      })
    )
    .optional(),
});

export const editPatientHandler = async (
  req: Request & { user?: { providerId: string } },
  res: Response
): Promise<void> => {
  const body = req.body;
  const params = req.params;
  logger.info("Editing patient");

  try {
    const providerId = assertValue(
      req.user?.providerId,
      "Missing logged providerId"
    );
    assertSchema(EditPatientRequestSchema, body);

    const editedPatient = Types.ObjectId.isValid(params.id)
      ? await PatientModel.findOneAndUpdate(
          { _id: params.id, providerId },
          body as any // dirty hack cuz mvp
        )
      : undefined;

    if (editedPatient) {
      res.status(200).send(editedPatient);
    } else {
      res.status(404).send(`Patient not found`);
    }
  } catch (error: any) {
    res.status(500).send(`Failed to edit patient: ${error.message}`);
  }
};
