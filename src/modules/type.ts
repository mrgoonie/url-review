export const imagesType = {
  where: {
    approved: true,
  },
  select: {
    blurBase64: true,
    height: true,
    width: true,
    url: true,
    mimetype: true,
  },
};

export const profileType = {
  select: {
    id: true,
    email: true,
    name: true,
    image: true,
    validEmail: true,
    UserRoles: { select: { id: true, role: { select: { name: true } }, endDate: true } },
    Workspace: true,
    UserBalance: {
      select: { id: true, cashType: true, balance: true },
    },
  },
};

export const userRolesType = { include: { role: { select: { name: true } } } };

export const productTagType = {
  select: {
    tag: {
      select: {
        name: true,
      },
    },
  },
};
