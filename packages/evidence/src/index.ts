import {
  EvidenceTargetType,
  StoredFilePurpose,
  StorageEventType,
  UserRole,
  VerificationStatus
} from "@prisma/client";
import { prisma } from "@platform/database";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export type FileInput = {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storageUrl: string;
  checksumSha256?: string;
  purpose?: StoredFilePurpose;
};

export type StoredFileView = {
  id: string;
  ownerUserId: string;
  purpose: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  currentVersion: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  versions: Array<{
    id: string;
    versionNumber: number;
    storageUrl: string;
    checksumSha256: string | null;
    uploadedByUserId: string | null;
    createdAt: string;
  }>;
  links: Array<{
    id: string;
    targetType: string;
    targetId: string;
    description: string | null;
    createdAt: string;
  }>;
};

export type MyDocumentView = {
  documentId: string;
  verificationRequestId: string;
  documentType: string;
  fileName: string;
  versionNumber: number;
  latestFileId: string | null;
  uploadedAt: string;
};

export function validateFileInput(input: FileInput) {
  const originalName = input.originalName.trim();
  const mimeType = input.mimeType.trim().toLowerCase();
  const storageUrl = input.storageUrl.trim();

  if (originalName.length < 2 || originalName.length > 160) {
    throw new Error("INVALID_FILE_NAME");
  }

  if (mimeType.length < 3 || mimeType.length > 120) {
    throw new Error("INVALID_MIME_TYPE");
  }

  if (!Number.isInteger(input.sizeBytes) || input.sizeBytes < 1 || input.sizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error("INVALID_FILE_SIZE");
  }

  try {
    new URL(storageUrl);
  } catch {
    throw new Error("INVALID_STORAGE_URL");
  }

  if (input.checksumSha256 && input.checksumSha256.trim().length > 200) {
    throw new Error("INVALID_CHECKSUM");
  }

  return {
    originalName,
    mimeType,
    sizeBytes: input.sizeBytes,
    storageUrl,
    checksumSha256: input.checksumSha256?.trim() || null,
    purpose: input.purpose ?? StoredFilePurpose.GENERAL
  };
}

function mapStoredFile(file: {
  id: string;
  ownerUserId: string;
  purpose: StoredFilePurpose;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  currentVersion: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  versions: Array<{
    id: string;
    versionNumber: number;
    storageUrl: string;
    checksumSha256: string | null;
    uploadedByUserId: string | null;
    createdAt: Date;
  }>;
  evidenceLinks: Array<{
    id: string;
    targetType: EvidenceTargetType;
    targetId: string;
    description: string | null;
    createdAt: Date;
  }>;
}): StoredFileView {
  return {
    id: file.id,
    ownerUserId: file.ownerUserId,
    purpose: file.purpose.toLowerCase(),
    originalName: file.originalName,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    currentVersion: file.currentVersion,
    isDeleted: file.isDeleted,
    createdAt: file.createdAt.toISOString(),
    updatedAt: file.updatedAt.toISOString(),
    versions: file.versions.map((version) => ({
      id: version.id,
      versionNumber: version.versionNumber,
      storageUrl: version.storageUrl,
      checksumSha256: version.checksumSha256,
      uploadedByUserId: version.uploadedByUserId,
      createdAt: version.createdAt.toISOString()
    })),
    links: file.evidenceLinks.map((link) => ({
      id: link.id,
      targetType: link.targetType.toLowerCase(),
      targetId: link.targetId,
      description: link.description,
      createdAt: link.createdAt.toISOString()
    }))
  };
}

async function assertTargetExists(targetType: EvidenceTargetType, targetId: string) {
  if (targetType === EvidenceTargetType.VERIFICATION_REQUEST) {
    const found = await prisma.verificationRequest.findUnique({ where: { id: targetId }, select: { id: true } });
    return Boolean(found);
  }

  if (targetType === EvidenceTargetType.REVIEW) {
    const found = await prisma.review.findUnique({ where: { id: targetId }, select: { id: true } });
    return Boolean(found);
  }

  if (targetType === EvidenceTargetType.REVIEW_MODERATION) {
    const found = await prisma.reviewModeration.findUnique({ where: { id: targetId }, select: { id: true } });
    return Boolean(found);
  }

  const found = await prisma.conversationMessage.findUnique({ where: { id: targetId }, select: { id: true } });
  return Boolean(found);
}

export async function createStoredFile(input: { actorUserId: string } & FileInput): Promise<StoredFileView> {
  const validated = validateFileInput(input);

  const file = await prisma.$transaction(async (transaction) => {
    const created = await transaction.storedFile.create({
      data: {
        ownerUserId: input.actorUserId,
        purpose: validated.purpose,
        originalName: validated.originalName,
        mimeType: validated.mimeType,
        sizeBytes: validated.sizeBytes,
        currentVersion: 1
      }
    });

    await transaction.documentVersion.create({
      data: {
        fileId: created.id,
        versionNumber: 1,
        storageUrl: validated.storageUrl,
        checksumSha256: validated.checksumSha256,
        uploadedByUserId: input.actorUserId
      }
    });

    await transaction.storageEvent.create({
      data: {
        fileId: created.id,
        type: StorageEventType.UPLOADED,
        versionNumber: 1,
        actorUserId: input.actorUserId,
        metadata: {
          originalName: validated.originalName,
          mimeType: validated.mimeType,
          sizeBytes: validated.sizeBytes
        }
      }
    });

    return transaction.storedFile.findUniqueOrThrow({
      where: { id: created.id },
      include: {
        versions: { orderBy: { versionNumber: "desc" } },
        evidenceLinks: { orderBy: { createdAt: "desc" } }
      }
    });
  });

  return mapStoredFile(file);
}

export async function getStoredFileById(input: {
  actorUserId: string;
  actorRole: "client" | "business" | "admin";
  fileId: string;
}): Promise<StoredFileView> {
  const file = await prisma.storedFile.findUnique({
    where: { id: input.fileId },
    include: {
      versions: { orderBy: { versionNumber: "desc" } },
      evidenceLinks: { orderBy: { createdAt: "desc" } }
    }
  });

  if (!file) {
    throw new Error("FILE_NOT_FOUND");
  }

  if (file.ownerUserId !== input.actorUserId && input.actorRole !== "admin") {
    throw new Error("FILE_ACCESS_FORBIDDEN");
  }

  return mapStoredFile(file);
}

export async function deleteStoredFile(input: {
  actorUserId: string;
  actorRole: "client" | "business" | "admin";
  fileId: string;
}) {
  const file = await prisma.storedFile.findUnique({ where: { id: input.fileId }, select: { id: true, ownerUserId: true, isDeleted: true } });

  if (!file) {
    throw new Error("FILE_NOT_FOUND");
  }

  if (file.ownerUserId !== input.actorUserId && input.actorRole !== "admin") {
    throw new Error("FILE_ACCESS_FORBIDDEN");
  }

  if (file.isDeleted) {
    return { success: true };
  }

  await prisma.$transaction([
    prisma.storedFile.update({
      where: { id: file.id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    }),
    prisma.storageEvent.create({
      data: {
        fileId: file.id,
        type: StorageEventType.DELETED,
        actorUserId: input.actorUserId
      }
    })
  ]);

  return { success: true };
}

export async function createEvidenceLink(input: {
  actorUserId: string;
  fileId: string;
  targetType: EvidenceTargetType;
  targetId: string;
  description?: string;
}) {
  const file = await prisma.storedFile.findUnique({ where: { id: input.fileId }, select: { id: true, isDeleted: true } });

  if (!file) {
    throw new Error("FILE_NOT_FOUND");
  }

  if (file.isDeleted) {
    throw new Error("FILE_ALREADY_DELETED");
  }

  const targetExists = await assertTargetExists(input.targetType, input.targetId);

  if (!targetExists) {
    throw new Error("EVIDENCE_TARGET_NOT_FOUND");
  }

  const link = await prisma.$transaction(async (transaction) => {
    const created = await transaction.evidenceLink.create({
      data: {
        fileId: input.fileId,
        targetType: input.targetType,
        targetId: input.targetId,
        description: input.description?.trim() || null,
        actorUserId: input.actorUserId
      }
    });

    await transaction.storageEvent.create({
      data: {
        fileId: input.fileId,
        type: StorageEventType.LINKED,
        actorUserId: input.actorUserId,
        metadata: {
          targetType: input.targetType,
          targetId: input.targetId,
          evidenceLinkId: created.id
        }
      }
    });

    return created;
  });

  return {
    id: link.id,
    fileId: link.fileId,
    targetType: link.targetType.toLowerCase(),
    targetId: link.targetId,
    description: link.description,
    createdAt: link.createdAt.toISOString()
  };
}

export async function listMyDocuments(actorUserId: string): Promise<MyDocumentView[]> {
  const request = await prisma.verificationRequest.findUnique({
    where: { userId: actorUserId },
    include: {
      documents: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          verificationRequestId: true,
          documentType: true,
          fileName: true,
          versionNumber: true,
          latestFileId: true,
          createdAt: true
        }
      }
    }
  });

  if (!request) {
    return [];
  }

  return request.documents.map((document) => ({
    documentId: document.id,
    verificationRequestId: document.verificationRequestId,
    documentType: document.documentType,
    fileName: document.fileName,
    versionNumber: document.versionNumber,
    latestFileId: document.latestFileId,
    uploadedAt: document.createdAt.toISOString()
  }));
}

export async function resubmitMyDocument(input: {
  actorUserId: string;
  documentId: string;
} & FileInput) {
  const validated = validateFileInput(input);

  const document = await prisma.verificationDocument.findUnique({
    where: { id: input.documentId },
    include: { verificationRequest: { select: { id: true, userId: true } } }
  });

  if (!document) {
    throw new Error("DOCUMENT_NOT_FOUND");
  }

  if (document.verificationRequest.userId !== input.actorUserId) {
    throw new Error("DOCUMENT_ACCESS_FORBIDDEN");
  }

  const updated = await prisma.$transaction(async (transaction) => {
    const file = await transaction.storedFile.create({
      data: {
        ownerUserId: input.actorUserId,
        purpose: StoredFilePurpose.VERIFICATION_DOCUMENT,
        originalName: validated.originalName,
        mimeType: validated.mimeType,
        sizeBytes: validated.sizeBytes,
        currentVersion: 1
      }
    });

    await transaction.documentVersion.create({
      data: {
        fileId: file.id,
        versionNumber: 1,
        storageUrl: validated.storageUrl,
        checksumSha256: validated.checksumSha256,
        uploadedByUserId: input.actorUserId
      }
    });

    await transaction.evidenceLink.create({
      data: {
        fileId: file.id,
        targetType: EvidenceTargetType.VERIFICATION_REQUEST,
        targetId: document.verificationRequestId,
        description: `Document resubmission for ${document.documentType}`,
        actorUserId: input.actorUserId
      }
    });

    await transaction.storageEvent.createMany({
      data: [
        {
          fileId: file.id,
          type: StorageEventType.UPLOADED,
          versionNumber: 1,
          actorUserId: input.actorUserId
        },
        {
          fileId: file.id,
          type: StorageEventType.LINKED,
          actorUserId: input.actorUserId,
          metadata: {
            targetType: EvidenceTargetType.VERIFICATION_REQUEST,
            targetId: document.verificationRequestId
          }
        }
      ]
    });

    await transaction.verificationDocument.update({
      where: { id: document.id },
      data: {
        fileName: validated.originalName,
        storageKey: validated.storageUrl,
        latestFileId: file.id,
        versionNumber: document.versionNumber + 1
      }
    });

    await transaction.verificationRequest.update({
      where: { id: document.verificationRequestId },
      data: {
        status: VerificationStatus.PENDING_REVIEW,
        notes: null
      }
    });

    await transaction.user.update({
      where: { id: input.actorUserId },
      data: { verificationStatus: VerificationStatus.PENDING_REVIEW }
    });

    return transaction.verificationDocument.findUniqueOrThrow({
      where: { id: document.id },
      include: { latestFile: true }
    });
  });

  return {
    documentId: updated.id,
    documentType: updated.documentType,
    fileName: updated.fileName,
    versionNumber: updated.versionNumber,
    latestFileId: updated.latestFileId,
    uploadedAt: updated.createdAt.toISOString()
  };
}

export function mapRoleToRuntime(role: UserRole): "client" | "business" | "admin" {
  if (role === UserRole.ADMIN) return "admin";
  if (role === UserRole.BUSINESS) return "business";
  return "client";
}
