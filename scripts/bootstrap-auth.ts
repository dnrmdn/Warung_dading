import { auth } from '../lib/auth';
import { prisma } from '../lib/prisma';

async function bootstrap() {
  console.log('=== Warung App — Initial Authentication Bootstrap ===');

  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD?.trim();
  const ownerEmail = process.env.BOOTSTRAP_OWNER_EMAIL?.trim();
  const ownerPassword = process.env.BOOTSTRAP_OWNER_PASSWORD?.trim();

  if (!adminEmail || !adminPassword) {
    console.error('Error: BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must be provided in environment.');
    process.exit(1);
  }

  // 1. Check if an ADMIN already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (existingAdmin) {
    console.log(`[Abort] An ADMIN account already exists (${existingAdmin.email}). Bootstrap aborted to prevent accidental overwrite.`);
    process.exit(0);
  }

  // 2. Create the first ADMIN account via Better Auth API
  console.log(`Creating initial ADMIN account (${adminEmail})...`);
  const adminResponse = await auth.api.signUpEmail({
    body: {
      name: 'Administrator Warung',
      email: adminEmail,
      password: adminPassword,
    },
  });

  if (!adminResponse?.user) {
    console.error('Failed to create admin user via Better Auth API.');
    process.exit(1);
  }

  // Ensure role is explicitly set to ADMIN in database
  await prisma.user.update({
    where: { id: adminResponse.user.id },
    data: { role: 'ADMIN', isActive: true },
  });
  console.log(`✓ Initial ADMIN account created successfully.`);

  // 3. Create initial OWNER account if credentials provided
  if (ownerEmail && ownerPassword) {
    const existingOwner = await prisma.user.findFirst({
      where: { email: ownerEmail },
    });

    if (!existingOwner) {
      console.log(`Creating initial OWNER account (${ownerEmail})...`);
      const ownerResponse = await auth.api.signUpEmail({
        body: {
          name: 'Pemilik Warung',
          email: ownerEmail,
          password: ownerPassword,
        },
      });

      if (ownerResponse?.user) {
        await prisma.user.update({
          where: { id: ownerResponse.user.id },
          data: { role: 'OWNER', isActive: true },
        });
        console.log(`✓ Initial OWNER account created successfully.`);
      }
    } else {
      console.log(`[Skip] User with email ${ownerEmail} already exists.`);
    }
  }

  console.log('=== Bootstrap Completed Successfully ===');
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('Bootstrap error:', err);
  process.exit(1);
});
