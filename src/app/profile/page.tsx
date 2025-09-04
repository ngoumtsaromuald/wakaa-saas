'use client';

import { AuthGuard } from "@/components/auth/AuthGuard";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile } from "@/hooks/useProfile";

export default function ProfilePage() {
  const { profile, updateProfile } = useProfile();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Mon Profil
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez vos informations personnelles et préférences de compte
            </p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations Personnelles</CardTitle>
                <CardDescription>
                  Mettez à jour vos informations de profil
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm profile={profile} onSave={updateProfile} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}